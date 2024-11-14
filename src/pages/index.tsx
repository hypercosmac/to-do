import { NextPage } from "next";
import Head from "next/head";
import { useMemo, useState } from "react";
import { createTodo, deleteTodo, toggleTodo, useTodos } from "../api";
import styles from "../styles/Home.module.css";
import { Todo } from "../types";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export const TodoList: React.FC = () => {
  const { data: todos, error } = useTodos();

  if (error != null) return <div>Error loading todos...</div>;
  if (todos == null) return <div>Loading...</div>;

  if (todos.length === 0) {
    return <div className={styles.emptyState}>Try adding a todo ☝️️</div>;
  }

  return (
    <ul className={styles.todoList}>
      {todos.map(todo => (
        <TodoItem todo={todo} />
      ))}
    </ul>
  );
};

const TodoItem: React.FC<{ todo: Todo }> = ({ todo }) => {
  const generateSubtasks = async () => {
    try {
      const response = await openai.createCompletion({
        model: "gpt-4",
        prompt: `Break down this task into smaller subtasks: "${todo.text}"`,
        max_tokens: 150,
        temperature: 0.7,
      });

      const subtasks = response.data.choices[0].text
        ?.split('\n')
        .filter(task => task.trim().length > 0);

      subtasks?.forEach(async (subtask) => {
        await createTodo(`${subtask} (subtask of: ${todo.text})`);
      });
    } catch (error) {
      console.error('Error generating subtasks:', error);
    }
  };

  return (
    <li className={styles.todo}>
      <label
        className={`${styles.label} ${todo.completed ? styles.checked : ""}`}
      >
        <input
          type="checkbox"
          checked={todo.completed}
          className={`${styles.checkbox}`}
          onChange={() => toggleTodo(todo)}
        />
        {todo.text}
      </label>

      <button 
        className={styles.aiButton} 
        onClick={generateSubtasks}
        title="Generate subtasks"
      >
        🤖
      </button>

      <button className={styles.deleteButton} onClick={() => deleteTodo(todo.id)}>
        ✕
      </button>
    </li>
  );
};

const AddTodoInput = () => {
  const [text, setText] = useState("");

  return (
    <form
      onSubmit={async e => {
        e.preventDefault();
        createTodo(text);
        setText("");
      }}
      className={styles.addTodo}
    >
      <input
        className={styles.input}
        placeholder="Buy some eggs"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <button className={styles.addButton}>Add</button>
    </form>
  );
};

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Railway NextJS Prisma</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <h1 className={styles.title}>Todos</h1>
        <h2 className={styles.desc}>
          Vikram's first backend deployment based onNextJS app connected to Postgres using Prisma and hosted on{" "}
          <a href="https://railway.app">Railway</a>
        </h2>
      </header>

      <main className={styles.main}>
        <AddTodoInput />

        <TodoList />
      </main>
    </div>
  );
};

export default Home;
