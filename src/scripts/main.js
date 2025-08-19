import { loadTasksFromStorage, saveTasksToStorage } from './storage'
import '../styles/style.css'

let tasks = loadTasksFromStorage()
let taskIdToDelete = null
let notificationTimer
const THEME_KEY = 'planner_theme'

// Elementos do DOM
const modal = document.getElementById('taskModal')
const addTaskBtn = document.getElementById('addTaskBtn')
const closeBtn = document.querySelector('.close-btn')
const taskForm = document.getElementById('taskForm')
const modalTitle = document.getElementById('modalTitle')
const taskIdInput = document.getElementById('taskId')
const deleteConfirmModal = document.getElementById('deleteConfirmModal')
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn')
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn')
const notification = document.getElementById('notification')
const themeToggle = document.getElementById('theme-toggle')
const body = document.body

// Funções
function openModal(task = null) {
    taskForm.reset()
    if (task) {
        // Modo Edição
        modalTitle.innerText = "Editar Tarefa"
        taskIdInput.value = task.id
        document.getElementById('taskTitle').value = task.title
        document.getElementById('taskDay').value = task.day
        document.getElementById('startTime').value = task.startTime
        document.getElementById('endTime').value = task.endTime
        document.getElementById('taskCategory').value = task.category
    } else {
        // Modo Adição
        modalTitle.innerText = "Nova Tarefa"
        taskIdInput.value = ''
    }
    modal.style.display = 'block'
}

function closeModal() {
    modal.style.display = 'none'
}

function openDeleteConfirmation(taskId) {
    taskIdToDelete = taskId
    deleteConfirmModal.style.display = 'flex'
}

function closeDeleteConfirmation() {
    taskIdToDelete = null
    deleteConfirmModal.style.display = 'none'
}

function showNotification(message, type = 'sucess') {
    clearTimeout(notificationTimer)

    notification.textContent = message
    notification.style.backgroundColor = type === 'error' ? 'var(--danger-color)' : 'var(--success-color)'
    notification.classList.add('show')

    notificationTimer = setTimeout(() => {
        notification.classList.remove('show')
    }, 3000)
}

function isTimeConflict(newTask) {
    for (const existingTask of tasks) {
        if (existingTask.id == newTask.id) {
            continue
        }
        if (existingTask.day === newTask.day) {
            const existingStart = existingTask.startTime
            const existingEnd = existingTask.endTime
            const newStart = newTask.startTime
            const newEnd = newTask.endTime

            if (newStart < existingEnd && newEnd > existingStart) {
                return true
            }
        }
    }
    return
}

function applyTheme(theme) {
    if (theme === 'dark') {
        body.classList.add('dark-theme')
        themeToggle.checked = true
    } else {
        body.classList.remove('dark-theme')
        themeToggle.checked = false
    }
}

function saveThemePreference(theme) {
    localStorage.setItem(THEME_KEY, theme)
}

function loadThemePreference() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light'
    applyTheme(savedTheme)
}

// Funções do CRUD
function addTask(taskData) {
    const newId = Date.now()
    delete taskData.id
    const newTask = { id: newId, ...taskData, isComplete: false }
    tasks.push(newTask)

    saveTasksToStorage(tasks)
    renderSchedule()
}

function updateTask(updatedTaskData) {
    const taskIndex = tasks.findIndex(t => t.id == updatedTaskData.id)
    if (taskIndex > -1) {
        tasks[taskIndex] = { ...tasks[taskIndex], ...updatedTaskData }
        saveTasksToStorage(tasks)
    }
    renderSchedule()
}

function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId)
    saveTasksToStorage(tasks)
    renderSchedule()
    showNotification("Tarefa deletada com sucesso!")
}

function toggleTaskComplete(taskId) {
    const taskIndex = tasks.findIndex(t => t.id == taskId)

    if (taskIndex > -1) {
        tasks[taskIndex].isComplete = !tasks[taskIndex].isComplete
    }

    saveTasksToStorage(tasks)
    renderSchedule()
}

function handleDrop(event) {
    event.preventDefault()

    const draggedTaskId = event.dataTransfer.getData('text/plain')
    const task = tasks.find(t => t.id == draggedTaskId)
    const dropZone = event.currentTarget.closest('.day-column')
    const newDay = dropZone.querySelector('.tasks-container').id.replace('-tasks', '')

    if (task && newDay) {
        task.day = newDay
        saveTasksToStorage(tasks)
        renderSchedule()
        showNotification("Tarefa movida com sucesso!")
    }

    document.querySelectorAll('.day-column').forEach(col => col.classList.remove('drag-over'))
}

// Funções de Renderização
function renderSchedule() {
    const containers = document.querySelectorAll('.tasks-container')
    containers.forEach(container => { container.innerHTML = '' })

    tasks.sort((a, b) => a.startTime.localeCompare(b.startTime))

    tasks.forEach(task => {
        const container = document.getElementById(`${task.day}-tasks`)
        if (container) {
            const taskCard = document.createElement('div')
            taskCard.className = `task-card ${task.category} ${task.isComplete ? 'completed' : ''}`
            taskCard.dataset.id = task.id
            taskCard.setAttribute('draggable', true)
            taskCard.innerHTML = `
                <input type="checkbox" class="task-complete-checkbox" ${task.isComplete ? 'checked' : ''}>
                <div class="task-content">
                    <h3>${task.title}</h3>
                    <p>${task.startTime} - ${task.endTime}</p>
                </div>
                <button class="delete-task-btn">&times;</button>
            `

            taskCard.addEventListener('dragstart', (event) => {
                event.dataTransfer.setData('text/plain', task.id)
                setTimeout(() => taskCard.classList.add('dragging'), 0)
            })

            taskCard.addEventListener('dragend', () => {
                taskCard.classList.add('dragging', 0)
            })

            // Adiciona evento de deletar
            taskCard.querySelector('.delete-task-btn').addEventListener('click', (e) => {
                e.stopPropagation()
                openDeleteConfirmation(task.id)
            })

            // Adiciona para a checkbox
            taskCard.querySelector('.task-complete-checkbox').addEventListener('click', (e) => {
                e.stopPropagation()
                toggleTaskComplete(task.id)
            })

            // Adiciona evento de editar (clique no card todo)
            taskCard.querySelector('.task-content').addEventListener('click', () => {
                openModal(task)
            })

            container.appendChild(taskCard)
        }
    })

    const dayColums = document.querySelectorAll('.day-column')
    dayColums.forEach(column => {
        column.addEventListener('dragover', (event) => {
            event.preventDefault()
            column.classList.add('drag-over')
        })

        column.addEventListener('dragleave', () => {
            column.classList.remove('drag-over')
        })

        column.addEventListener('drop', handleDrop)
    })
}

// Event Listeners
// Abrir modal para nova tarefa
addTaskBtn.addEventListener('click', () => openModal())

// Fechar modal no 'x'
closeBtn.addEventListener('click', closeModal)

// Fechar modal clicando fora dele
window.addEventListener('click', (event) => {
    if (event.target == modal) {
        closeModal()
    }
})

// Lógica do Formulário (Salvar tarefa)
taskForm.addEventListener('submit', (event) => {
    event.preventDefault()

    const taskData = {
        id: document.getElementById('taskId').value,
        title: document.getElementById('taskTitle').value,
        day: document.getElementById('taskDay').value,
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value,
        category: document.getElementById('taskCategory').value,
    }

    if (taskData.startTime >= taskData.endTime) {
        showNotification("O horário final deve ser depois do horário inicial", 'error')
        return
    }

    if (isTimeConflict(taskData)) {
        showNotification("Já existe uma tarefa nesse período!", 'error')
        return
    }

    if (taskData.id) {
        updateTask(taskData)
        showNotification("Tarefa atualizada com sucesso!")
    } else {
        addTask(taskData)
        showNotification("Tarefa criada com sucesso!")
    }

    closeModal()
})

confirmDeleteBtn.addEventListener('click', () => {
    if (taskIdToDelete) {
        deleteTask(taskIdToDelete)
    }
    closeDeleteConfirmation()
})
cancelDeleteBtn.addEventListener('click', closeDeleteConfirmation)

themeToggle.addEventListener('change', () => {
    const newTheme = themeToggle.checked ? 'dark' : 'light'
    applyTheme(newTheme)
    saveThemePreference(newTheme)
})

// Renderização Inicial
document.addEventListener('DOMContentLoaded', () => {
    loadThemePreference()
    renderSchedule()
})