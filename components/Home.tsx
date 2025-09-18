import React from "react";

interface Props {
  setStep: (step: string) => void;
  startNewProject: () => void;
}

const Home: React.FC<Props> = ({ setStep, startNewProject }) => {
  return (
    <div className="card home-card">
      <h1>Igor Lozar s.p. – PVC Ograje</h1>
      <p>Vaš digitalni pomočnik za izračun, vizualizacijo in pripravo ponudb.</p>
      
      <div style={{ margin: '30px 0' }}>
        <button onClick={startNewProject} className="btn-primary">Začni Nov Projekt</button>
      </div>

      <div>
        <button onClick={() => setStep("projects")} className="btn-secondary">Preglej Obstoječe Projekte</button>
        <button onClick={() => setStep("calendar")} className="btn-secondary">Koledar</button>
        <button onClick={() => setStep("settings")} className="btn-secondary">Nastavitve</button>
      </div>
    </div>
  );
};

export default Home;