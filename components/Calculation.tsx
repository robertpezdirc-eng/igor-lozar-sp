import React, { useState, useEffect, useCallback } from "react";
import type { ProjectData, PurchasePrices, LaborData, CustomMaterial } from "..";
import type { SettingsData } from "../utils/dataStorage";

interface MaterialQuantities {
    panels: number;
    posts: number;
    screws: number;
    concreteBags: number;
}

interface CostResult {
    materialCost: number;
    laborCost: number;
    totalCost: number;
}

interface Props {
  setStep: (step: string, data?: Partial<ProjectData>) => void;
  projectData: ProjectData | null;
  setProjectData: React.Dispatch<React.SetStateAction<ProjectData | null>>;
  settings: SettingsData | null;
}

const Calculation: React.FC<Props> = ({ setStep, projectData, setProjectData, settings }) => {
  // State for inputs
  const [length, setLength] = useState(25);
  const [height, setHeight] = useState(1.2);
  const [gates, setGates] = useState(1);
  const [fenceType, setFenceType] = useState("Standard PVC");
  
  const [prices, setPrices] = useState<PurchasePrices>({
    panel: 50, post: 20, screws: 0.5, concrete: 5, gate: 150
  });
  const [labor, setLabor] = useState<LaborData>({
    hourlyRate: 25, hours: 8
  });

  const [quantities, setQuantities] = useState<MaterialQuantities>({
    panels: 0, posts: 0, screws: 0, concreteBags: 0
  });
  const [costs, setCosts] = useState<CostResult | null>(null);
  
  const [showPriceEditor, setShowPriceEditor] = useState(false);
  const [customMaterials, setCustomMaterials] = useState<CustomMaterial[]>([]);
  const [newItem, setNewItem] = useState({ id: '', name: '', quantity: 1, unit: 'kos', pricePerUnit: 0 });


  // Effect to initialize state from projectData
  useEffect(() => {
    if (projectData) {
        setLength(projectData.fenceLength || 25);
        setFenceType(projectData.fenceType || "Standard PVC");
        setGates(projectData.gates || 1);
        
        let initialHeight = projectData.fenceHeight;
        if (!initialHeight) {
            switch(projectData.fenceSystemType) {
                case 'balkonska': initialHeight = 1.0; break;
                case 'terasa': initialHeight = 0.9; break;
                default: initialHeight = 1.2;
            }
        }
        setHeight(initialHeight);
        
        const initialPrices = projectData.purchasePrices || settings?.defaultPrices || { panel: 50, post: 20, screws: 0.5, concrete: 5, gate: 150 };
        setPrices(initialPrices);

        const initialLabor = projectData.labor || { hours: 8, hourlyRate: settings?.defaultLabor?.hourlyRate || 25 };
        setLabor(initialLabor);

        if (projectData.materials) {
            setQuantities(projectData.materials);
        }
        
        setCustomMaterials(projectData.customMaterials || []);

        if (projectData.costs) {
            setCosts(projectData.costs);
        }
    }
  }, [projectData, settings]);
  
  // Effect to calculate QUANTITIES from dimensions
  useEffect(() => {
    const panelWidth = 2.0;
    const calculatedPanels = Math.ceil(length / panelWidth);
    const calculatedPosts = calculatedPanels + 1;
    const calculatedScrews = calculatedPanels * 8;
    const calculatedConcreteBags = Math.ceil(calculatedPosts * 0.5);

    setQuantities({
        panels: calculatedPanels,
        posts: calculatedPosts,
        screws: calculatedScrews,
        concreteBags: calculatedConcreteBags
    });
  }, [length]);


  // Effect to calculate COSTS from quantities, prices, and labor
  const calculateAndUpdateCosts = useCallback(() => {
    const { panel, post, screws: screwPrice, concrete, gate: gatePrice } = prices;

    const standardMaterialCost = 
        (quantities.panels * panel) +
        (quantities.posts * post) +
        (quantities.screws * screwPrice) +
        (quantities.concreteBags * concrete) +
        (gates * gatePrice);
    
    const customMaterialCost = customMaterials.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);

    const materialCost = standardMaterialCost + customMaterialCost;

    const laborCost = labor.hours * labor.hourlyRate;
    const totalCost = materialCost + laborCost;

    const newCosts: CostResult = { materialCost, laborCost, totalCost };
    setCosts(newCosts);
    
    // Save everything to main project state
    setProjectData(prev => prev ? { 
        ...prev, 
        fenceLength: length, 
        fenceHeight: height, 
        gates, 
        fenceType, 
        materials: quantities,
        purchasePrices: prices, 
        labor: labor, 
        costs: newCosts,
        customMaterials: customMaterials,
    } : null);
  }, [quantities, prices, labor, gates, length, height, fenceType, setProjectData, customMaterials]);

  useEffect(() => {
      calculateAndUpdateCosts();
  }, [calculateAndUpdateCosts]);


  // Handlers for interactive editing
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setPrices(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  }
  
  const handleLaborChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setLabor(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  }

  const adjustQuantity = (item: 'panels' | 'posts', amount: number) => {
    setQuantities(prev => {
        const newValue = (prev[item] || 0) + amount;
        const newQuantities = { ...prev, [item]: Math.max(0, newValue) };

        if (item === 'panels') {
            newQuantities.posts = newQuantities.panels + 1;
            newQuantities.screws = newQuantities.panels * 8;
            newQuantities.concreteBags = Math.ceil(newQuantities.posts * 0.5);
        } else if (item === 'posts') {
            newQuantities.concreteBags = Math.ceil(newQuantities.posts * 0.5);
        }

        return newQuantities;
    });
  };

  const handleNewItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({...prev, [name]: value}));
  };

  const addCustomMaterial = () => {
      if (!newItem.name || newItem.quantity <= 0 || newItem.pricePerUnit < 0) {
          alert("Vnesite veljavno ime, količino in ceno za novo postavko.");
          return;
      }
      setCustomMaterials(prev => [...prev, { ...newItem, id: `custom_${Date.now()}` }]);
      setNewItem({ id: '', name: '', quantity: 1, unit: 'kos', pricePerUnit: 0 }); // Reset form
  };

  const removeCustomMaterial = (id: string) => {
    setCustomMaterials(prev => prev.filter(item => item.id !== id));
  };


  const handleNext = () => {
      if (!costs) {
          alert("Izračun ni končan. Prosimo počakajte.");
          return;
      }
      setStep('montagePlan');
  }

  return (
    <div className="card">
      <h2>2. korak: Interaktivni Izračun</h2>
      <p>Vnesite mere in takoj vidite strošek. Količine lahko tudi ročno prilagodite.</p>
      
      <div style={{border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '20px'}}>
        <h3>Vnos meritev</h3>
        <div className="form-group">
            <label htmlFor="length">Dolžina ograje (m):</label>
            <input id="length" type="number" value={length} onChange={e => setLength(parseFloat(e.target.value))} />
        </div>
        <div className="form-group">
            <label htmlFor="height">Višina ograje (m):</label>
            <input id="height" type="number" value={height} onChange={e => setHeight(parseFloat(e.target.value))} step="0.1" />
        </div>
        <div className="form-group">
            <label htmlFor="gates">Število vrat:</label>
            <input id="gates" type="number" value={gates} onChange={e => setGates(parseInt(e.target.value, 10) || 0)} />
        </div>
         <div className="form-group">
            <label htmlFor="fenceType">Tip ograje (za opombo):</label>
            <input id="fenceType" type="text" value={fenceType} onChange={e => setFenceType(e.target.value)} />
        </div>
      </div>

       <div style={{border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#f8f9fa'}}>
            <h3 style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <span>Cene materiala in dela</span>
                 <button onClick={() => setShowPriceEditor(!showPriceEditor)} className="btn-secondary" style={{padding: '5px 10px', fontSize: '0.9rem', margin: 0}}>
                    {showPriceEditor ? 'Skrij' : 'Uredi'}
                </button>
            </h3>
            {showPriceEditor && (
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px'}}>
                  <div>
                      <h5>Material (€/kos)</h5>
                      <div className="form-group">
                          <label>Panel:</label>
                          <input type="number" name="panel" value={prices.panel} onChange={handlePriceChange} />
                      </div>
                      <div className="form-group">
                          <label>Steber:</label>
                          <input type="number" name="post" value={prices.post} onChange={handlePriceChange} />
                      </div>
                      <div className="form-group">
                          <label>Vrata:</label>
                          <input type="number" name="gate" value={prices.gate} onChange={handlePriceChange} />
                      </div>
                      <div className="form-group">
                          <label>Vijaki (enota):</label>
                          <input type="number" name="screws" value={prices.screws} onChange={handlePriceChange} step="0.1" />
                      </div>
                       <div className="form-group">
                          <label>Beton (vreča):</label>
                          <input type="number" name="concrete" value={prices.concrete} onChange={handlePriceChange} />
                      </div>
                  </div>
                  <div>
                      <h5>Delo</h5>
                      <div className="form-group">
                          <label>Urna postavka (€):</label>
                          <input type="number" name="hourlyRate" value={labor.hourlyRate} onChange={handleLaborChange} />
                      </div>
                      <div className="form-group">
                          <label>Ocenjene ure:</label>
                          <input type="number" name="hours" value={labor.hours} onChange={handleLaborChange} />
                      </div>
                  </div>
                </div>
            )}
        </div>

      <div className="results-container">
        <h3>Rezultati (v realnem času):</h3>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px'}}>
          <div>
            <h4>Osnovni Material</h4>
            <div className="form-group" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <label style={{flex: 1}}>Paneli:</label>
              <button onClick={() => adjustQuantity('panels', -1)} style={{padding: '5px 10px'}}>-</button>
              <span style={{fontWeight: 'bold', minWidth: '30px', textAlign: 'center'}}>{quantities.panels}</span>
              <button onClick={() => adjustQuantity('panels', 1)} style={{padding: '5px 10px'}}>+</button>
            </div>
             <div className="form-group" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <label style={{flex: 1}}>Stebri:</label>
              <button onClick={() => adjustQuantity('posts', -1)} style={{padding: '5px 10px'}}>-</button>
              <span style={{fontWeight: 'bold', minWidth: '30px', textAlign: 'center'}}>{quantities.posts}</span>
              <button onClick={() => adjustQuantity('posts', 1)} style={{padding: '5px 10px'}}>+</button>
            </div>
            <div style={{fontSize: '0.9rem', color: '#555', marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px'}}>
                <p style={{margin: '4px 0'}}>Vijaki: <strong>{quantities.screws} kos</strong></p>
                <p style={{margin: '4px 0'}}>Vreče betona: <strong>{quantities.concreteBags} kos</strong></p>
            </div>
          </div>
          {costs && (
            <div>
              <h4>Stroški</h4>
              <p>Material: {costs.materialCost.toFixed(2)} €</p>
              <p>Delo: {costs.laborCost.toFixed(2)} €</p>
              <p style={{fontSize: '1.2rem', marginTop: '10px'}}><strong>Skupaj (brez DDV): {costs.totalCost.toFixed(2)} €</strong></p>
            </div>
          )}
        </div>
        
        <div style={{marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px'}}>
          <h4>Dodatni material / Storitve</h4>
          {customMaterials.map(item => (
            <div key={item.id} style={{display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 0'}}>
                <span style={{flex: 1}}>{item.name} ({item.quantity} {item.unit})</span>
                <span style={{fontWeight: 'bold'}}>{(item.quantity * item.pricePerUnit).toFixed(2)} €</span>
                <button onClick={() => removeCustomMaterial(item.id)} style={{background: '#e74c3c', padding: '2px 8px', fontSize: '0.9rem'}}>&times;</button>
            </div>
          ))}
          <div style={{display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap', borderTop: '1px solid #eee', paddingTop: '10px'}}>
              <input type="text" name="name" placeholder="Ime postavke" value={newItem.name} onChange={handleNewItemChange} style={{flex: '2 1 150px'}} />
              <input type="number" name="quantity" placeholder="Kol." value={newItem.quantity} onChange={handleNewItemChange} style={{flex: '1 1 60px'}}/>
              <input type="text" name="unit" placeholder="Enota" value={newItem.unit} onChange={handleNewItemChange} style={{flex: '1 1 60px'}}/>
              <input type="number" name="pricePerUnit" placeholder="Cena/enoto" value={newItem.pricePerUnit} onChange={handleNewItemChange} style={{flex: '1 1 80px'}}/>
              <button onClick={addCustomMaterial} style={{flex: '1 1 100%'}}>Dodaj</button>
          </div>
        </div>
      </div>


      <hr />
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap-reverse'}}>
        <button onClick={() => setStep("projectStart")} className="btn-secondary">Nazaj</button>
        <button onClick={handleNext} className="btn-primary" disabled={!costs}>Naprej na Načrt Montaže</button>
      </div>
    </div>
  );
};

export default Calculation;