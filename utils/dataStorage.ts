import type { ProjectData } from "..";

export interface SettingsData {
    companyName?: string;
    companyAddress?: string;
    phone?: string;
    email?: string;
    taxID?: string;
    vatRate?: number;
    logo?: string | null;
    invoiceFooterText?: string;
    defaultPrices?: {
        panel: number;
        post: number;
        screws: number;
        concrete: number;
        gate: number;
    };
    defaultLabor?: {
        hourlyRate: number;
    };
}

const PROJECTS_KEY = 'pvc_ograje_projects';
const SETTINGS_KEY = 'pvc_ograje_settings';

// Helper to simulate async behavior of a real API, making UI feel responsive
const simulateDelay = () => new Promise(resolve => setTimeout(resolve, 250));

// --- Project Functions ---

export async function getProjects(): Promise<ProjectData[]> {
    await simulateDelay();
    const projectsJson = localStorage.getItem(PROJECTS_KEY);
    return projectsJson ? JSON.parse(projectsJson) : [];
}

export async function saveProject(projectData: ProjectData): Promise<ProjectData> {
    await simulateDelay();
    const projects = await getProjects();
    const existingIndex = projects.findIndex(p => p.id === projectData.id);
    if (existingIndex > -1) {
        // Update existing project
        projects[existingIndex] = projectData;
    } else {
        // Add new project
        projects.push(projectData);
    }
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    return projectData;
}

export async function deleteProject(projectId: string): Promise<void> {
    await simulateDelay();
    let projects = await getProjects();
    projects = projects.filter(p => p.id !== projectId);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

// --- Settings Functions ---

export async function getSettings(): Promise<SettingsData> {
    await simulateDelay();
    const settingsJson = localStorage.getItem(SETTINGS_KEY);
    // Return default settings if nothing is stored
    if (!settingsJson) {
        return {
            companyName: 'Igor Lozar s.p.',
            companyAddress: 'Cesta 123\n1000 Ljubljana',
            phone: '041 123 456',
            email: 'info@igorlozar.si',
            taxID: 'SI12345678',
            vatRate: 22,
            logo: null,
            invoiceFooterText: 'Rok plačila je 8 dni. V primeru zamude se obračunajo zakonske zamudne obresti.',
            defaultPrices: { panel: 50, post: 20, screws: 0.5, concrete: 5, gate: 150 },
            defaultLabor: { hourlyRate: 25 },
        };
    }
    return JSON.parse(settingsJson);
}

export async function saveSettings(settingsData: SettingsData): Promise<SettingsData> {
    await simulateDelay();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsData));
    return settingsData;
}

// --- Backup/Restore Functions ---

export async function exportData(): Promise<void> {
    const projects = await getProjects();
    const settings = await getSettings();
    const backupData = {
        projects,
        settings,
        exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pvc_ograje_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export async function importData(file: File): Promise<void> {
    const text = await file.text();
    const data = JSON.parse(text);

    if (data.projects && data.settings) {
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(data.projects));
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
    } else {
        throw new Error("Neveljavna datoteka za uvoz. Manjkajo 'projects' ali 'settings' podatki.");
    }
}