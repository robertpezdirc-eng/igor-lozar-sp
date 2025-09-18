import React, { useState, useEffect } from "react";
import type { ProjectData } from "..";
import { GoogleGenAI } from "@google/genai";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectData: ProjectData | null;
}

const AIHelper: React.FC<Props> = ({ isOpen, onClose, projectData }) => {
  
  const generateInitialPrompt = () => {
    if (!projectData) {
      return "Predlagaj mi moderno PVC ograjo za hišo v alpskem stilu. Teren je rahlo nagnjen. Dolžina je 30m, višina 1m. Poudarek na varnosti in estetiki.";
    }
    const { fenceSystemType, fenceLength, fenceHeight, fenceType, images, projectNotes } = projectData;
    let base = "Svetuj mi glede ograje.";
    if (fenceSystemType) {
      const typeText = {
          dvoriščna: 'dvoriščno PVC ograjo',
          balkonska: 'balkonsko ograjo (varnost je ključna!)',
          terasa: 'terasno / vrtno ograjo'
      }[fenceSystemType];
      base = `Predlagaj mi dizajn za ${typeText}.`;
    }
    if (fenceLength && fenceHeight) {
      base += ` Dolžina je približno ${fenceLength}m, višina ${fenceHeight}m.`;
    }
    if (fenceType && fenceType !== "Standard PVC") {
      base += ` Željen stil je "${fenceType}".`;
    }
     if (projectNotes) {
      base += ` Upoštevaj naslednje opombe stranke: "${projectNotes}".`;
    }
    if (images && images.length > 0) {
        base += ` Upoštevaj okolico in obstoječe stanje na priloženi sliki.`;
    }
    base += " Poudarek naj bo na varnosti, trajnosti in moderni estetiki, ki se sklada z okolico.";
    return base;
  };

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
      if (isOpen) {
          setPrompt(generateInitialPrompt());
          setResult("");
          setError("");
      }
  }, [isOpen, projectData]);


  const handleGenerate = async () => {
    if (!prompt) {
      setError("Vnesite opis za AI pomočnika.");
      return;
    }
     if (!process.env.API_KEY) {
        setError("API ključ za Gemini ni nastavljen. Prosimo, nastavite ga v okoljskih spremenljivkah.");
        return;
    }
    setLoading(true);
    setResult("");
    setError("");

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const systemInstruction = `Ti si strokovnjak za PVC ograje v Sloveniji za podjetje "Igor Lozar s.p.". Tvoje stranke so monterji. Bodi jedrnat, strokoven in ponudi konkretne, praktične nasvete v slovenščini. Uporabnik ti bo dal opis projekta, ti pa mu svetuj glede dizajna, materialov, barv in optimizacije. Če je priložena slika, jo uporabi kot glavni vir za kontekst in priporočila.`;
        
        let contents: any = prompt;

        if (projectData?.images && projectData.images.length > 0) {
            try {
                const firstImage = projectData.images[0]; // This is a data URL
                const mimeTypeMatch = firstImage.match(/^data:(.*);base64,/);
                if (!mimeTypeMatch) {
                    throw new Error("Invalid base64 image format.");
                }
                const mimeType = mimeTypeMatch[1];
                const base64Data = firstImage.split(',')[1];
                
                contents = {
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: mimeType, data: base64Data } }
                    ]
                };
            } catch (e) {
                console.error("Image processing error:", e);
                setError("Napaka pri obdelavi slike. Poskusil bom brez nje.");
                // Fallback to text-only if image processing fails
                contents = prompt;
            }
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        setResult(response.text);

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Neznana napaka";
      setError(`Napaka pri komunikaciji z AI: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="ai-helper-overlay open" onClick={onClose}>
        <div 
          className="ai-helper-modal" 
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-helper-title"
        >
            <div className="ai-helper-header">
                <h2 id="ai-helper-title">✨ AI Pomočnik</h2>
                <button 
                  onClick={onClose} 
                  className="ai-helper-close-btn"
                  aria-label="Zapri AI Pomočnika"
                >&times;</button>
            </div>
            <div className="ai-helper-content">
                <p>Opišite vaše želje, teren in proračun, AI pa vam bo predlagal optimalno rešitev in dizajn ograje.</p>
                {projectData?.images && projectData.images.length > 0 && (
                    <div style={{ textAlign: 'center', margin: '15px 0', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '8px' }}>
                        <img src={projectData.images[0]} alt="Project context" style={{ maxWidth: '120px', borderRadius: '8px' }} />
                        <p style={{margin: '5px 0 0 0'}}><small>AI bo analiziral tudi prvo sliko iz galerije.</small></p>
                    </div>
                )}
                <div className="form-group">
                    <label htmlFor="ai-prompt">Vaš opis projekta (AI ga je predizpolnil):</label>
                    <textarea 
                        id="ai-prompt"
                        value={prompt} 
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Npr. Iščem ograjo za moderno hišo z ravno streho, dolžine 20m..."
                        rows={5}
                    />
                </div>
                 {loading && <div className="loader"></div>}
                 {error && <p style={{color: 'red'}}>{error}</p>}

                {result && (
                    <div className="ai-chat-response">
                      <h3>Predlog AI Pomočnika:</h3>
                      <p>{result}</p>
                    </div>
                )}
            </div>
             <div className="ai-helper-footer">
                <button onClick={handleGenerate} disabled={loading} className="btn-primary" style={{width: '100%'}}>
                    {loading ? "Razmišljam..." : "Pridobi nasvet AI"}
                </button>
             </div>
        </div>
    </div>
  );
};

export default AIHelper;