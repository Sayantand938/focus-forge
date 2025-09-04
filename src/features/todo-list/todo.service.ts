// src/features/todo-list/todo.service.ts
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/shared/lib/firebase";
import { useAuthStore } from "@/features/auth/auth.store";
import type { Todo, Status } from "./todo.store";

// Helper to get the current user's ID
const getCurrentUserId = (): string => {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error("User not authenticated");
  return user.uid;
};

// Helper to get a reference to the user's todos collection
const getTodosCollectionRef = () => {
  const uid = getCurrentUserId();
  return collection(db, "users", uid, "todos");
};

// Helper to convert Firestore Timestamps to JS Date objects
const mapFirestoreDocToTodo = (doc: any): Todo => {
  const data = doc.data();
  return {
    id: doc.id,
    task: data.task,
    tag: data.tag,
    priority: data.priority,
    status: data.status,
    createdAt: (data.createdAt as Timestamp)?.toDate(),
    dueDate: (data.dueDate as Timestamp)?.toDate(),
  };
};

export const todoService = {
  /**
   * Sets up a real-time listener for the user's todos.
   * @param onDataChange Callback function that receives the updated list of todos.
   * @returns An unsubscribe function to clean up the listener.
   */
  subscribeToTodos(onDataChange: (todos: Todo[]) => void) {
    const todosCollection = getTodosCollectionRef();
    const q = query(todosCollection, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const todos = querySnapshot.docs.map(mapFirestoreDocToTodo);
      onDataChange(todos);
    }, (error) => {
      console.error("[TodoService] Failed to subscribe to todos:", error);
    });

    return unsubscribe;
  },

  async add(newTodo: Omit<Todo, "id" | "createdAt" | "status">): Promise<string> {
    const todosCollection = getTodosCollectionRef();
    const docRef = await addDoc(todosCollection, {
      ...newTodo,
      status: "Pending",
      createdAt: serverTimestamp(),
      dueDate: newTodo.dueDate ? Timestamp.fromDate(newTodo.dueDate) : null,
    });
    return docRef.id;
  },
  
  async update(updatedTodo: Todo): Promise<void> {
    const todoDocRef = doc(getTodosCollectionRef(), updatedTodo.id);
    await updateDoc(todoDocRef, {
      task: updatedTodo.task,
      tag: updatedTodo.tag || null,
      priority: updatedTodo.priority,
      status: updatedTodo.status,
      dueDate: updatedTodo.dueDate ? Timestamp.fromDate(updatedTodo.dueDate) : null,
    });
  },

  async remove(id: string): Promise<void> {
    const todoDocRef = doc(getTodosCollectionRef(), id);
    await deleteDoc(todoDocRef);
  },

  async setStatus(id: string, status: Status): Promise<void> {
    const todoDocRef = doc(getTodosCollectionRef(), id);
    await updateDoc(todoDocRef, { status });
  },

  async clearAndImportAll(todos: Todo[]): Promise<void> {
    console.log(`[TodoService] Clearing and importing ${todos.length} todos.`);
    const todosCollection = getTodosCollectionRef();
    
    // 1. Delete all existing documents
    const existingDocs = await getDocs(query(todosCollection));
    const deleteBatch = writeBatch(db);
    existingDocs.forEach(doc => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();
    
    // 2. Import new documents
    if (todos.length > 0) {
      const importBatch = writeBatch(db);
      todos.forEach(todo => {
        const docRef = doc(todosCollection, todo.id); // Use the original ID
        importBatch.set(docRef, {
            ...todo,
            createdAt: Timestamp.fromDate(todo.createdAt),
            dueDate: todo.dueDate ? Timestamp.fromDate(todo.dueDate) : null,
        });
      });
      await importBatch.commit();
    }
  },
};