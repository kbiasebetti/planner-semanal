const STORAGE_KEY = 'weekly_planner_tasks'

/**
 * Salva o array de tarefas atual no Local Storage
 * @param {Array}
 */
export function saveTasksToStorage(tasksToSave) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksToSave))
}

/**
 * Carrega as tarefas do Local Storage
 * @returns {Array}
 */
export function loadTasksFromStorage() {
  const storedTasks = localStorage.getItem(STORAGE_KEY)

  if (storedTasks) {
    return JSON.parse(storedTasks)
  } else {
    return []
  }
}