import React, { useState, useEffect, useRef } from "react";
import type { ProjectData } from "..";

interface Props {
  setStep: (step: string, data?: Partial<ProjectData>) => void;
  projectData: ProjectData | null;
}

const FENCE_TYPES = [
    { id: 'dvoriščna', label: 'Dvoriščna PVC ograja' },
    { id: 'balkonska', label: 'Balkonska ograja (PVC, steklo, kombinacije)' },
    { id: 'terasa', label: 'Terasna / vrtna ograja' }
] as const;

type FenceTypeIds = typeof FENCE_TYPES[number]['id'];

const ProjectStart: React.FC<Props> = ({ setStep, projectData }) => {
  const [fenceSystemType, setFenceSystemType] = useState<FenceTypeIds>(
    projectData?.fenceSystemType || 'dvoriščna'
  );
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [projectNotes, setProjectNotes] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);


  useEffect(() => {
    if (projectData) {
        if (projectData.client) {
            setClientName(projectData.client.name || "");
            setClientAddress(projectData.client.address || "");
            setClientEmail(projectData.client.email || "");
        }
        if (projectData.images) {
            setImages(projectData.images);
        }
        setProjectNotes(projectData.projectNotes || "");
    }
  }, [projectData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setIsUploading(true);
        setError("");
        const files = Array.from(e.target.files);
        const base64Promises = files.map(file => {
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = error => reject(error);
            });
        });

        try {
            const base64Images = await Promise.all(base64Promises);
            setImages(prev => [...prev, ...base64Images]);
        } catch (error) {
            console.error("Error converting images to base64:", error);
            setError("Napaka pri nalaganju slik.");
        } finally {
            setIsUploading(false);
        }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };


  const handleNext = () => {
    if (!clientName) {
        setError("Prosimo, vnesite vsaj ime stranke.");
        return;
    }

    const clientData = {
        name: clientName,
        address: clientAddress,
        email: clientEmail
    };
    setStep("calculation", { fenceSystemType, client: clientData, images, projectNotes });
  };

    const handleStartCamera = async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Dostop do kamere ni mogoč. Preverite dovoljenja v brskalniku.");
            setIsCameraOpen(false);
        }
    };

    const handleStopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraOpen(false);
    };

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setImages(prev => [...prev, dataUrl]);
            handleStopCamera();
        }
    };

  return (
    <div className="card">
      {isCameraOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1002, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', width: '90%', maxWidth: '600px', textAlign: 'center' }}>
                <h3>Kamera</h3>
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: 'auto', borderRadius: '8px', marginBottom: '15px' }} />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div style={{display: 'flex', justifyContent: 'center', gap: '10px'}}>
                    <button onClick={handleCapture} className="btn-primary">Zajemi Sliko</button>
                    <button onClick={handleStopCamera} className="btn-secondary">Prekliči</button>
                </div>
            </div>
        </div>
      )}
      <h2>1. korak: Začetek in Podatki o Stranki</h2>
      <p>Vnesite osnovne podatke o projektu in stranki ter izberite tip ograje.</p>
      
      <h3>Podatki o stranki</h3>
      {error && <p style={{color: '#e74c3c', fontWeight: 'bold', textAlign: 'center', background: 'rgba(231, 76, 60, 0.1)', padding: '10px', borderRadius: '5px', border: '1px solid rgba(231, 76, 60, 0.2)', marginBottom: '15px'}}>{error}</p>}
       <div className="form-group">
        <label htmlFor="clientName">Ime in Priimek / Naziv podjetja:</label>
        <input id="clientName" type="text" value={clientName} onChange={e => { setClientName(e.target.value); setError(""); }} placeholder="Janez Novak"/>
      </div>
      <div className="form-group">
        <label htmlFor="clientAddress">Naslov:</label>
        <textarea id="clientAddress" value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="Cesta 1, 1000 Ljubljana"/>
      </div>
       <div className="form-group">
        <label htmlFor="clientEmail">Email:</label>
        <input id="clientEmail" type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="janez.novak@email.com"/>
      </div>
       <div className="form-group">
        <label htmlFor="projectNotes">Opombe / Posebnosti:</label>
        <textarea id="projectNotes" value={projectNotes} onChange={e => setProjectNotes(e.target.value)} placeholder="Npr. teren v naklonu, posebne želje stranke, težaven dostop..."/>
      </div>
      
      <hr />

      <h3>Galerija Slik Projekta</h3>
        <p>Naložite slike terena, obstoječe ograje ali inspiracije. To bo pomagalo pri načrtovanju in AI predlogih.</p>
        <div className="form-group">
            <label htmlFor="image-upload">Dodaj slike iz naprave:</label>
            <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
              <input id="image-upload" type="file" multiple accept="image/*" onChange={handleImageUpload} disabled={isUploading} style={{flex: 1}}/>
              <button type="button" onClick={handleStartCamera} disabled={isUploading} style={{padding: '10px 15px'}}>Fotografiraj</button>
            </div>
            {isUploading && <div className="loader" style={{width: '20px', height: '20px', margin: '10px 0'}}></div>}
        </div>
        <div className="image-gallery-preview" style={{display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px'}}>
            {images.map((imgSrc, index) => (
                <div key={index} style={{position: 'relative'}}>
                    <img src={imgSrc} alt={`Slika projekta ${index + 1}`} style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px'}} />
                    <button onClick={() => removeImage(index)} style={{position: 'absolute', top: '2px', right: '2px', background: 'rgba(231, 76, 60, 0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', lineHeight: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.3)'}}>
                        &times;
                    </button>
                </div>
            ))}
        </div>

      <hr />

      <h3>Tip Ograje</h3>
      <div className="form-group">
        <div className="btn-toggle-group">
            {FENCE_TYPES.map(type => (
                 <button 
                    key={type.id}
                    className={`btn-toggle ${fenceSystemType === type.id ? 'selected' : ''}`}
                    onClick={() => setFenceSystemType(type.id)}
                 >
                    {type.label}
                 </button>
            ))}
        </div>
      </div>
      
      <div style={{display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap-reverse', marginTop: '20px'}}>
        <button onClick={() => setStep("home")} className="btn-secondary">Nazaj</button>
        <button onClick={handleNext} className="btn-primary">Naprej na Izračun</button>
      </div>
    </div>
  );
};

export default ProjectStart;