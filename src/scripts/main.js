import { loadTasksFromStorage, saveTasksToStorage } from './storage'
import '../styles/style.css'

let tasks = loadTasksFromStorage()
let taskIdToDelete = null
let notificationTimer

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
    deleteConfirmModal.style.display = 'block'
}

function closeDeleteConfirmation() {
    taskIdToDelete = null
    deleteConfirmModal.style.display = 'none'
}

function showNotification(message) {
    clearTimeout(notificationTimer)

    notification.textContent = message
    notification.classList.add('show')

    notificationTimer = setTimeout(() => {
        notification.classList.remove('show')
    }, 3000)
}

// Funções do CRUD
function addTask(taskData) {
    const newId = Date.now()
    delete taskData.id

    const newTask = { id: newId, ...taskData }
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

// Funções de Renderização
function renderSchedule() {
    const containers = document.querySelectorAll('.tasks-container')
    containers.forEach(container => { container.innerHTML = '' })

    tasks.sort((a, b) => a.startTime.localeCompare(b.startTime))

    tasks.forEach(task => {
        const container = document.getElementById(`${task.day}-tasks`)
        if (container) {
            const taskCard = document.createElement('div')
            taskCard.className = `task-card ${task.category}`
            taskCard.dataset.id = task.id
            taskCard.innerHTML = `
                <h3>${task.title}</h3>
                <p>${task.startTime} - ${task.endTime}</p>
                <button class="delete-task-btn">&times</button> 
            `

            // Adiciona evento de deletar
            taskCard.querySelector('.delete-task-btn').addEventListener('click', (e) => {
                e.stopPropagation()
                openDeleteConfirmation(task.id)
            })

            // Adiciona evento de editar (clique no card todo)
            taskCard.addEventListener('click', () => {
                openModal(task)
            })

            container.appendChild(taskCard)
        }
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

    if (taskData.id) {
        updateTask(taskData)
    } else {
        addTask(taskData)
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

// Renderização Inicial
document.addEventListener('DOMContentLoaded', renderSchedule)