import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { api } from '../../services/api'

interface Client {
    id: string
    name: string
    logo_url?: string
}

interface Project {
    id: string
    client_id: string
    name: string
    description?: string
    status: string
}

interface ProjectState {
    clients: Client[]
    projects: Project[] // Projects for the selected client (or all visible)
    currentClient: Client | null
    currentProject: Project | null
    loading: boolean
    error: string | null
}

const initialState: ProjectState = {
    clients: [],
    projects: [],
    currentClient: null,
    currentProject: null,
    loading: false,
    error: null,
}

export const fetchClients = createAsyncThunk('project/fetchClients', async () => {
    return await api.getClients()
})

export const fetchClientProjects = createAsyncThunk('project/fetchClientProjects', async (clientId: string) => {
    return await api.getClientProjects(clientId)
})

export const fetchProjectDetails = createAsyncThunk('project/fetchProjectDetails', async (projectId: string) => {
    return await api.getProject(projectId)
})

const projectSlice = createSlice({
    name: 'project',
    initialState,
    reducers: {
        setCurrentProject(state, action: PayloadAction<Project | null>) {
            state.currentProject = action.payload
            if (action.payload) {
                // Save to localStorage for persistence
                localStorage.setItem('currentProjectId', action.payload.id)
            } else {
                localStorage.removeItem('currentProjectId')
            }
        },
        setCurrentClient(state, action: PayloadAction<Client | null>) {
            state.currentClient = action.payload
            if (action.payload) {
                localStorage.setItem('currentClientId', action.payload.id)
            } else {
                localStorage.removeItem('currentClientId')
                localStorage.removeItem('currentProjectId')
            }
        },
        clearProjectContext(state) {
            state.currentProject = null
            state.currentClient = null
            localStorage.removeItem('currentProjectId')
            localStorage.removeItem('currentClientId')
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchClients.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchClients.fulfilled, (state, action) => {
                state.loading = false
                state.clients = action.payload
            })
            .addCase(fetchClients.rejected, (state, action) => {
                state.loading = false
                state.error = action.error.message || 'Failed to fetch clients'
            })
            .addCase(fetchClientProjects.fulfilled, (state, action) => {
                state.projects = action.payload
            })
            .addCase(fetchProjectDetails.fulfilled, (state, action) => {
                state.currentProject = action.payload
                // Try to find and set current client if we have clients loaded
                if (state.clients.length > 0) {
                    const client = state.clients.find(c => c.id === action.payload.client_id)
                    if (client) state.currentClient = client
                }
            })
    },
})

export const { setCurrentProject, setCurrentClient, clearProjectContext } = projectSlice.actions
export default projectSlice.reducer
