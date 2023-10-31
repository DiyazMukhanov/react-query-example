import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';

import Modal from '../UI/Modal.jsx';
import EventForm from './EventForm.jsx';
import { fetchEvent, updateEvent, queryClient } from '../../util/http.js';
import ErrorBlock from '../UI/ErrorBlock.jsx';

export default function EditEvent() {
  const navigate = useNavigate();
  const params = useParams();

  const {data, isPending, isError, error} = useQuery({
    queryKey: ['events', params.id],
    queryFn: ({signal}) => fetchEvent({ signal, id: params.id})
  })

  const { mutate } = useMutation({
    mutationFn: updateEvent,
    onMutate: async (data) => { //data автоматически берётся из данных переданных в mutate
      const newEvent = data.event;

      await queryClient.cancelQueries({queryKey: ['events', params.id]}); // чтобы предотвратить конфликты если этот же запрос будет идти во время оптимистичного обновления

      //чтобы откатиться в случае неуспешного запроса делаем:
      const previousEvent = queryClient.getQueryData(['events', params.id]);

      queryClient.setQueryData(['events', params.id], newEvent); 

      return { previousEvent }
    },
    onError: (error, data, context) => {
      queryClient.setQueryData(['events', params.id], context.previousEvent)
    },

    onSettled: () => { //произойдёт когда закончится запрос, неважно успешен или нет
       queryClient.invalidateQueries(['events', params.id]); //чтобы обновить данные с бэка, если поменялось там что-то
    }
  });

  function handleSubmit(formData) {
    mutate({id: params.id, event: formData});
    navigate('../');
  }

  function handleClose() {
    navigate('../');
  }

  let content;

  if(isPending) {
    content = <div>Loading...</div>
  }

  if(isError) {
    content = <>
    <ErrorBlock title='Failed' message={error.info?.message || 'Failed'}/>
    </>
  }

  if(data) {
    content = <EventForm inputData={data} onSubmit={handleSubmit}>
    <Link to="../" className="button-text">
      Cancel
    </Link>
    <button type="submit" className="button">
      Update
    </button>
  </EventForm>
  }

  return (
    <Modal onClose={handleClose}>
      {content}
    </Modal>
  );
}
