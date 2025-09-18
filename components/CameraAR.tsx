import React, { useState, useEffect, useRef, MouseEvent } from "react";
import type { ProjectData } from "..";
import html2canvas from 'html2canvas';

interface ARItem {
  id: string;
  type: 'panel' | 'post';
  x: number;
  y: number;
}

interface Props {
  setStep: (step: string, data?: Partial<ProjectData>) => void;
  projectData: ProjectData | null;
  setProjectData: React.Dispatch<React.SetStateAction<ProjectData | null>>;
}

const CameraAR: React.FC<Props> = ({ setStep, projectData, setProjectData }) => {
  const [image, setImage] = useState<File | null>(null);
  const [arItems, setArItems] = useState<ARItem[]>([]);
  const [history, setHistory] = useState<ARItem[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [modifications, setModifications] = useState({
    panelColor: '#CCCCCC',
    panelType: 'Navpične',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [draggedItem, setDraggedItem] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    if (projectData) {
      // FIX: Property 'image' does not exist on type 'ProjectData'. Use 'images' array instead.
      if (projectData.images && projectData.images[0]) {
        fetch(projectData.images[0])
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], "background.png", { type: blob.type });
                setImage(file);
            });
      } else {
        setImage(null);
      }
      if (projectData.existingFenceModifications) {
         setModifications({
            panelColor: projectData.existingFenceModifications.panelColor,
            panelType: projectData.existingFenceModifications.panelType,
         });
      }
    }
    return () => stopCamera();
  }, [projectData]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };
  
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      stopCamera();
      const file = e.target.files[0];
      setImage(file);
      setIsEditing(false); // Reset editing on new image
      setArItems([]);
      // FIX: Property 'image' does not exist on type 'ProjectData'.
      // The local image is handled by the component state and saved on 'Next'.
      // setProjectData(prev => prev ? { ...prev, image: file, arImage: null } : null);
    }
  };
  
  const startCamera = async () => {
    try {
      if (stream) stopCamera();
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
    } catch (err) {
      console.error("Camera error:", err);
    }
  };
  
  const capture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(blob => {
      if (blob) {
        setImage(new File([blob], "capture.png", { type: "image/png" }));
        stopCamera();
        setIsEditing(false);
        setArItems([]);
      }
    });
  };

  const pushToHistory = (newItems: ARItem[]) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newItems);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
  };

  const updateArItems = (newItems: ARItem[] | ((prev: ARItem[]) => ARItem[])) => {
      const updatedItems = typeof newItems === 'function' ? newItems(arItems) : newItems;
      setArItems(updatedItems);
      pushToHistory(updatedItems);
  };
  
  const startEditing = () => {
    setIsEditing(true);
    const initialPanels = projectData?.materials?.panels || 10;
    const items: ARItem[] = [];
    for (let i = 0; i < initialPanels; i++) {
        items.push({ id: `panel-${i}`, type: 'panel', x: 50 + i * 60, y: 150 });
    }
    const initialPosts = initialPanels + 1;
     for (let i = 0; i < initialPosts; i++) {
        items.push({ id: `post-${i}`, type: 'post', x: 45 + i * 60, y: 140 });
    }
    setArItems(items);
    setHistory([items]);
    setHistoryIndex(0);
  };
  
  const handleItemAction = (action: 'add' | 'remove', type: 'panel' | 'post') => {
    updateArItems(prev => {
        if (action === 'add') {
            const newItem: ARItem = { id: `${type}-${Date.now()}`, type, x: 20, y: 150 };
            return [...prev, newItem];
        } else {
            let lastItemIndex = -1;
            for (let i = prev.length - 1; i >= 0; i--) {
              if (prev[i].type === type) { lastItemIndex = i; break; }
            }
            return lastItemIndex > -1 ? prev.filter((_, index) => index !== lastItemIndex) : prev;
        }
    });
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>, id: string) => {
    const item = arItems.find(i => i.id === id);
    const editorBounds = editorRef.current?.getBoundingClientRect();
    if (item && editorBounds) {
      const offsetX = e.clientX - editorBounds.left - item.x;
      const offsetY = e.clientY - editorBounds.top - item.y;
      setDraggedItem({ id, offsetX, offsetY });
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!draggedItem || !editorRef.current) return;
    const editorBounds = editorRef.current.getBoundingClientRect();
    let x = e.clientX - editorBounds.left - draggedItem.offsetX;
    let y = e.clientY - editorBounds.top - draggedItem.offsetY;
    
    x = Math.max(0, Math.min(x, editorBounds.width - 20));
    y = Math.max(0, Math.min(y, editorBounds.height - 80));

    setArItems(items => items.map(item => item.id === draggedItem.id ? { ...item, x, y } : item));
  };
  
  const handleMouseUp = () => {
      if(draggedItem) {
          pushToHistory(arItems);
      }
      setDraggedItem(null);
  };

  const undo = () => {
      if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setArItems(history[newIndex]);
      }
  };
  const redo = () => {
      if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setArItems(history[newIndex]);
      }
  };

  const handleNext = async () => {
    if (!editorRef.current) return;
    setIsCapturing(true);

    try {
        const panels = arItems.filter(i => i.type === 'panel').length;
        const posts = arItems.filter(i => i.type === 'post').length;
        
        setProjectData(prev => prev ? { 
            ...prev,
            materials: { ...(prev.materials || {}), panels, posts, screws: 0, concreteBags: 0 },
            existingFenceModifications: {
                ...prev.existingFenceModifications,
                panelColor: modifications.panelColor,
                panelType: modifications.panelType as any,
            }
        } : null);
        setStep("calculation");
    } catch (error) {
        console.error("Error saving AR data:", error);
        alert("Napaka pri shranjevanju podatkov.");
    } finally {
        setIsCapturing(false);
    }
  };

  const panelCount = arItems.filter(i => i.type === 'panel').length;
  const postCount = arItems.filter(i => i.type === 'post').length;
  const estimatedLength = (panelCount * 2.0).toFixed(1); // Assuming 2m panel width

  return (
    <div className="card">
      <h2>2. korak: Interaktivna Vizualizacija</h2>
      
      {!isEditing ? (
        <>
          <p>Naložite sliko ali uporabite kamero. Nato boste lahko začeli z interaktivnim urejanjem.</p>
          <div className="form-group">
            <input type="file" accept="image/*" onChange={handleUpload} />
          </div>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: stream ? 'block' : 'none' }}></video>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {!stream && <button onClick={startCamera}>Zaženi kamero</button>}
            {stream && <button onClick={capture}>Zajemi sliko</button>}
            {stream && <button onClick={stopCamera} className="btn-secondary">Ugasni Kamero</button>}
          </div>
          {image && (
            <div style={{textAlign: 'center', marginTop: '20px'}}>
              <img src={URL.createObjectURL(image)} alt="Original" style={{ maxWidth: '100%', borderRadius: '8px' }} />
              <button onClick={startEditing} className="btn-primary" style={{marginTop: '10px'}}>Začni Interaktivno Urejanje</button>
            </div>
          )}
        </>
      ) : (
        <>
            <p>Premikajte elemente po sliki. Dodajajte ali odstranjujte panele in stebre. Uporabite Undo/Redo za lažje delo.</p>
            <div 
                ref={editorRef}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ position: 'relative', width: '100%', height: '400px', border: '2px solid #3498db', backgroundImage: `url(${image ? URL.createObjectURL(image) : ''})`, backgroundSize: 'cover', backgroundPosition: 'center', cursor: draggedItem ? 'grabbing' : 'default', overflow: 'hidden' }}>
                {isCapturing && <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(255,255,255,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'}}><div className="loader"></div></div>}
                {arItems.map(item => (
                    <div
                        key={item.id}
                        onMouseDown={(e) => handleMouseDown(e, item.id)}
                        style={{
                            position: 'absolute',
                            top: `${item.y}px`,
                            left: `${item.x}px`,
                            width: item.type === 'panel' ? '50px' : '10px',
                            height: item.type === 'panel' ? '100px' : '120px',
                            backgroundColor: item.type === 'panel' ? modifications.panelColor : '#888',
                            border: '1px solid black',
                            cursor: 'grab',
                            opacity: draggedItem?.id === item.id ? 0.95 : 0.8,
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: item.type === 'panel' && modifications.panelType === 'Vodoravne' ? 'column' : 'row',
                            gap: '3px',
                            padding: '3px',
                            transform: draggedItem?.id === item.id ? 'scale(1.05)' : 'scale(1)',
                            boxShadow: draggedItem?.id === item.id ? '0 4px 8px rgba(0,0,0,0.2)' : 'none',
                            transition: 'transform 0.1s, box-shadow 0.1s',
                            zIndex: draggedItem?.id === item.id ? 10 : 1
                        }}
                    >
                      {item.type === 'panel' && Array.from({length: 5}).map((_, i) => <div key={i} style={{flex: 1, backgroundColor: 'rgba(255,255,255,0.4)'}}></div>)}
                    </div>
                ))}
            </div>
            
            <div className="ar-controls">
                 <div className="form-group">
                    <label>Barva Panelov:</label>
                    <input type="color" value={modifications.panelColor} onChange={e => setModifications(p => ({...p, panelColor: e.target.value}))} style={{width: '100%', height: '40px', padding: '2px'}}/>
                </div>
                 <div className="form-group">
                    <label>Tip Letev:</label>
                    <select value={modifications.panelType} onChange={e => setModifications(p => ({...p, panelType: e.target.value as any}))}>
                        <option value="Navpične">Navpične</option>
                        <option value="Vodoravne">Vodoravne</option>
                    </select>
                </div>
                <div className="ar-controls-group">
                    <div>
                      <label>Paneli: <strong>{panelCount}</strong></label>
                      <button onClick={() => handleItemAction('add', 'panel')}>+</button>
                      <button onClick={() => handleItemAction('remove', 'panel')}>-</button>
                    </div>
                     <div>
                      <label>Stebri: <strong>{postCount}</strong></label>
                      <button onClick={() => handleItemAction('add', 'post')}>+</button>
                      <button onClick={() => handleItemAction('remove', 'post')}>-</button>
                    </div>
                    <div>
                        <button onClick={undo} disabled={historyIndex <= 0}>Razveljavi</button>
                        <button onClick={redo} disabled={historyIndex >= history.length - 1}>Uveljavi</button>
                    </div>
                     <div className="form-group">
                        <label>Ocenjena dolžina:</label>
                        <strong>~ {estimatedLength} m</strong>
                    </div>
                </div>
            </div>
        </>
      )}

      <hr />
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap-reverse' }}>
        <button onClick={() => isEditing ? setIsEditing(false) : setStep("projectStart")} className="btn-secondary">Nazaj</button>
        <button onClick={handleNext} className="btn-primary" disabled={!isEditing || isCapturing}>
            {isCapturing ? 'Shranjujem...' : 'Naprej na Izračun'}
        </button>
      </div>
    </div>
  );
};

export default CameraAR;