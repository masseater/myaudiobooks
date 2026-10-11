import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { make } from "effect/reactivity/Atom";

type TodoFilter = "all" | "open" | "done";

const todoFilterAtom = make<TodoFilter>("all");

const useTodoFilter = (): TodoFilter => useAtomValue(todoFilterAtom);

const useSelectTodoFilter = (): ((filter: TodoFilter) => void) => useAtomSet(todoFilterAtom);

export type { TodoFilter };
export { useSelectTodoFilter, useTodoFilter };
