import React, { useState } from "react";
import type { ProjectData } from "..";
import { deleteProject, saveProject } from "../utils/dataStorage";

interface Props {
  setStep: (step: string) => void;
  allProjects: ProjectData[];
  setAllProjects: React.Dispatch<React.SetStateAction<ProjectData[]>>;
  loadProject: (project: ProjectData) => void;
}

const Projects: React.FC<Props> = ({ setStep, allProjects, setAllProjects, loadProject }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleDelete = async (projectId: string) => {
    if (window.confirm("Ali ste prepričani, da želite izbrisati ta projekt?")) {
      try {
        await deleteProject(projectId);
        setAllProjects(prev => prev.filter(p => p.id !== projectId));
      } catch (error) {
        alert(`Napaka pri brisanju projekta: ${error}`);
      }
    }
  };
  
  const handleComplete = async (project: ProjectData) => {
    if (window.confirm(`Želite projekt za "${project.client?.name || project.id}" označiti kot zaključen?`)) {
        const updatedProject = { ...project, status: 'Zaključeno' as const };
        try {
            await saveProject(updatedProject);
            setAllProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
        } catch (error) {
            alert(`Napaka pri posodabljanju statusa projekta: ${error}`);
        }
    }
  };

  const handleNavigate = (address?: string) => {
    if (!address) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  };

  const getStatusClass = (status: ProjectData['status']) => {
    switch (status) {
      case 'Zaključeno': return 'done';
      case 'V izvedbi': return 'in-progress';
      case 'Načrtovano': return 'planned';
      default: return '';
    }
  };

  const filteredProjects = allProjects.filter(p => {
    const clientName = p.client?.name || '';
    const status = p.status || '';
    const searchLower = searchTerm.toLowerCase();
    return clientName.toLowerCase().includes(searchLower) ||
           status.toLowerCase().includes(searchLower);
  }).sort((a, b) => (a.client?.name || "").localeCompare(b.client?.name || ""));


  const renderContent = () => {
    if (allProjects.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '30px 0' }}>
          <p>Trenutno nimate shranjenih projektov.</p>
          <button onClick={() => setStep("home")} className="btn-primary">Začni Nov Projekt</button>
        </div>
      );
    }
    if (filteredProjects.length === 0) {
      return <p>Ni najdenih projektov, ki bi ustrezali vašemu iskanju.</p>;
    }
    return filteredProjects.map(p => (
        <div key={p.id} className="project-item">
          <div style={{flex: 1}}>
            <span style={{fontWeight: 'bold'}}>{p.client?.name || `Projekt ${p.id.slice(-4)}`}</span>
            <br/>
            <small style={{color: '#555'}}>{p.client?.address}</small>
          </div>
          <span className={`status ${getStatusClass(p.status)}`}>{p.status}</span>
          <div className="project-actions">
            <button onClick={() => loadProject(p)} className="btn-icon open" title="Odpri projekt" aria-label={`Odpri projekt za ${p.client?.name || 'neznano stranko'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><path d="M10 4H4c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
            </button>
             <button 
              onClick={() => handleNavigate(p.client?.address)}
              disabled={!p.client?.address}
              title={p.client?.address ? `Navigiraj na: ${p.client.address}` : "Naslov ni vnesen"}
              className="btn-icon navigate"
              aria-label={`Navigiraj na naslov za projekt ${p.client?.name || 'neznano stranko'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            </button>
            {p.status !== 'Zaključeno' && 
              <button onClick={() => handleComplete(p)} className="btn-icon complete" title="Označi kot zaključeno" aria-label={`Označi projekt za ${p.client?.name || 'neznano stranko'} kot zaključen`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              </button>
            }
            <button onClick={() => handleDelete(p.id)} className="btn-icon delete" title="Izbriši projekt" aria-label={`Izbriši projekt za ${p.client?.name || 'neznano stranko'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
          </div>
        </div>
      ));
  }

  return (
    <div className="card">
      <h2>Obstoječi Projekti</h2>
      {allProjects.length > 0 && (
        <div className="form-group">
          <input 
            type="text" 
            placeholder="Išči po stranki ali statusu..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      )}
      <div className="project-list">
        {renderContent()}
      </div>
      <button onClick={() => setStep("home")}>Nazaj</button>
    </div>
  );
};

export default Projects;