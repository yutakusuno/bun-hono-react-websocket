import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { z } from 'zod';
import { hc } from 'hono/client';

import {
  Message,
  MessageFormSchema,
  MessageFormValues,
  DataToSend,
  publishActions,
} from '@shared/types';
import { BACKEND_DEV_WS_URL, BACKEND_DEV_URL } from '@shared/constants';
import type { AppType } from '@server/index';
import './App.css';

const honoClient = hc<AppType>(BACKEND_DEV_URL);
const initialValues: MessageFormValues = {
  userId: Math.random().toString(36).slice(-8),
  text: '',
};

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [formValues, setFormValues] =
    useState<MessageFormValues>(initialValues);
  const [formErrors, setFormErrors] = useState<z.ZodIssue[]>([]);

  useEffect(() => {
    const fetchMessages = async () => {
      const response = await honoClient.messages.$get();
      if (!response.ok) {
        console.error('Failed to fetch messages');
        return;
      }
      const messages: Message[] = await response.json();
      setMessages(messages);
    };

    fetchMessages();
  }, []);

  useEffect(() => {
    const socket = new WebSocket(`${BACKEND_DEV_WS_URL}/ws`);

    socket.onopen = (event) => {
      console.log('WebSocket client opened', event);
    };

    socket.onmessage = (event) => {
      try {
        const data: DataToSend = JSON.parse(event.data.toString());
        switch (data.action) {
          case publishActions.UPDATE_CHAT:
            setMessages((prev) => [...prev, data.message]);
            break;
          case publishActions.DELETE_CHAT:
            setMessages((prev) =>
              prev.filter((message) => message.id !== data.message.id)
            );
            break;
          default:
            console.error('Unknown data:', data);
        }
      } catch (_) {
        console.log('Message from server:', event.data);
      }
    };

    socket.onclose = (event) => {
      console.log('WebSocket client closed', event);
    };

    return () => {
      socket.close();
    };
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const validatedValues = MessageFormSchema.parse(formValues);
      const response = await honoClient.messages.$post({
        form: validatedValues,
      });
      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setFormValues(initialValues);
      setFormErrors([]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Form validation errors:', error.issues);
        setFormErrors(error.issues);
      } else {
        console.error('Error:', error);
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await honoClient.messages[':id'].$delete({
        param: { id: id.toString() },
      });
      if (!response.ok) {
        throw new Error('Failed to delete message');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="container mx-auto max-w-lg bg-gray-900 text-white">
      <div className="flex flex-col h-screen">
        <div className="overflow-auto mb-4 flex-grow">
          {messages.map((message) => (
            <div
              key={message.id}
              className="p-2 border border-gray-800 rounded-md"
            >
              <div className="flex justify-between">
                <strong className="text-left">{message.userId}:</strong>
                <span className="text-right text-gray-500 text-sm">
                  {message.date}
                </span>
                <button
                  onClick={() => handleDelete(message.id)}
                  className="text-xs p-1 ml-2 bg-red-500 text-white rounded-md"
                >
                  Delete
                </button>
              </div>
              <div>{message.text}</div>
            </div>
          ))}
        </div>
        <div className="flex-none px-2 py-5">
          <form
            method="post"
            onSubmit={handleSubmit}
            className="flex items-center space-x-2"
          >
            <input name="userId" defaultValue={formValues.userId} hidden />
            <input
              name="text"
              value={formValues.text}
              onChange={handleInputChange}
              className="flex-grow p-2 border border-gray-800 rounded-md bg-gray-800 text-white"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              Send
            </button>
          </form>
          {formErrors.length > 0 && (
            <>
              {formErrors.map((error) => (
                <div
                  key={error.path.join('-')}
                  className="p-2 mt-2 text-red-500 border border-red-500 rounded-md"
                >
                  {error.message}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
