import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import Home from "./components/Home";
import ProjectStart from "./components/SelectFenceType";
import Projects from "./components/Projects";
import Settings from "./components/Settings";
import Calculation from "./components/Calculation";
import MontagePlan from "./components/MontagePlan";
import AIHelper from "./components/AIHelper";
import Calendar from "./components/Calendar";
import { getProjects, getSettings } from "./utils/dataStorage";
import type { SettingsData } from "./utils/dataStorage";

export interface PurchasePrices {
  panel: number;
  post: number;
  screws: number;
  concrete: number;
  gate: number;
}

export interface LaborData {
  hourlyRate: number;
  hours: number;
}

export interface ExistingFenceModifications {
    panelColor: string;
    panelType: 'Navpične' | 'Vodoravne' | 'Dekorativne';
    accessories: string[];
}

export interface MontageChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface CustomMaterial {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
}

export interface ProjectData {
  id:string;
  status: 'Načrtovano' | 'V izvedbi' | 'Zaključeno';
  fenceSystemType?: 'dvoriščna' | 'balkonska' | 'terasa';
  fenceLength?: number;
  fenceHeight?: number;
  fenceType?: string;
  gates?: number;
  materials?: {
    panels: number;
    posts: number;
    screws: number;
    concreteBags: number;
  };
  costs?: {
    materialCost: number;
    laborCost: number;
    totalCost: number;
  };
  client?: {
    name: string;
    address: string;
    email: string;
  };
  images?: string[]; // Array of base64 encoded images
  purchasePrices?: PurchasePrices;
  labor?: LaborData;
  hasExistingFence?: boolean;
  existingFenceModifications?: ExistingFenceModifications;
  projectNotes?: string;
  montageNotes?: string;
  montageChecklist?: MontageChecklistItem[];
  customMaterials?: CustomMaterial[];
  startDate?: string;
  endDate?: string;
}


function App() {
  const [step, setStep] = useState("home");
  const [currentProjectData, setCurrentProjectData] = useState<ProjectData | null>(null);
  const [allProjects, setAllProjects] = useState<ProjectData[]>([]);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAiHelperOpen, setIsAiHelperOpen] = useState(false);

  useEffect(() => {
    // Load projects and settings from backend on initial render
    const loadInitialData = async () => {
        try {
            const [projects, settingsData] = await Promise.all([getProjects(), getSettings()]);
            setAllProjects(projects);
            setSettings(settingsData);
        } catch (error) {
            console.error("Failed to load initial data from backend:", error);
            alert("Napaka pri nalaganju podatkov s strežnika.");
        } finally {
            setLoading(false);
        }
    };
    loadInitialData();
  }, []);
  

  const navigateTo = (newStep: string, data?: Partial<ProjectData>) => {
    if (data) {
      setCurrentProjectData(prevData => ({
        ...(prevData || { id: `proj_${Date.now()}`, status: 'Načrtovano' }),
        ...data
      }));
    }
    setStep(newStep);
  };
  
  const startNewProject = () => {
      setCurrentProjectData({ id: `proj_${Date.now()}`, status: 'Načrtovano' });
      setStep("projectStart");
  }

  const loadProject = (project: ProjectData) => {
    setCurrentProjectData(project);
    setStep("calculation"); // Go to a relevant step for an existing project
  };


  const renderStep = () => {
    if (loading) {
        return <div className="card"><div className="loader"></div><p style={{textAlign: 'center'}}>Nalaganje podatkov...</p></div>
    }
    switch(step) {
      case "home": return <Home setStep={navigateTo} startNewProject={startNewProject} />;
      case "projectStart": return <ProjectStart setStep={navigateTo} projectData={currentProjectData} />;
      case "calculation": return <Calculation setStep={navigateTo} projectData={currentProjectData} setProjectData={setCurrentProjectData} settings={settings} />;
      case "montagePlan": return <MontagePlan setStep={navigateTo} projectData={currentProjectData} setProjectData={setCurrentProjectData} setAllProjects={setAllProjects} settings={settings} />;
      case "projects": return <Projects setStep={navigateTo} allProjects={allProjects} setAllProjects={setAllProjects} loadProject={loadProject} />;
      case "settings": return <Settings setStep={navigateTo} settings={settings} setSettings={setSettings} />;
      case "calendar": return <Calendar setStep={navigateTo} allProjects={allProjects} loadProject={loadProject} />;
      default: return <Home setStep={navigateTo} startNewProject={startNewProject} />;
    }
  }

  return (
    <div>
      <header>Igor Lozar s.p. – PVC Ograje</header>
      <div className="container">
        {renderStep()}
      </div>
      <button 
        className="fab" 
        onClick={() => setIsAiHelperOpen(true)} 
        title="AI Pomočnik"
        aria-label="Odpri AI Pomočnika"
      >
        ✨ AI
      </button>
      <AIHelper 
        isOpen={isAiHelperOpen} 
        onClose={() => setIsAiHelperOpen(false)} 
        projectData={currentProjectData} 
      />
    </div>
  );
}

const container = document.getElementById("root")!;
const root = createRoot(container);
root.render(<App />);