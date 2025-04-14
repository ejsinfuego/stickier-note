import { useState, useEffect } from 'react';
import './App.css';

const { ipcRenderer } = window.require('electron');

function App() {
  const [note, setNote] = useState('');
  const [opacity] = useState(1);
  const [isClickThrough] = useState(false);
  const [noteColor, setNoteColor] = useState('#FFFF88');
  const [textColor, setTextColor] = useState('#000000');
  const [textContent, setTextContent] = useState('');

  interface NoteData {
    note: string;
    noteColor: string;
    textColor: string;
    textContent: string;
  }

  useEffect(() => {
    if (note === '' && noteColor === '#FFFF88' && textColor === '#000000') return;
    const noteData = {
      note,
      noteColor,
      textColor,
      textContent
    };
    
    ipcRenderer.invoke('save-note', noteData);
  }, [note, noteColor, textColor, textContent]);


  useEffect(() => {
    ipcRenderer.invoke('get-note').then((noteData: NoteData) => {
      if (noteData) {
        setNote(noteData.note || '');
        setNoteColor(noteData.noteColor || '#FFFF88');
        setTextColor(noteData.textColor || '#000000');
        setTextContent(noteData.textContent || '');
      }
    });
  }, []);

  useEffect(() => {
    ipcRenderer.send('set-opacity', opacity);
  }, [opacity]);

  useEffect(() => {
    ipcRenderer.send('set-ignore-mouse-events', isClickThrough, { forward: true });
  }, [isClickThrough]);

  return (
    <div 
      className="sticky-note"
      style={{ backgroundColor: noteColor }}
    >
      <div className="note-header">
        <div className="note-controls">
          <div className="button-group">
          <button 
            className="control-btn close-btn"
          onClick={() => window.close()}
          >
            ×
          </button>
          <button className='control-btn minimize-btn' 
          onClick={() =>
            ipcRenderer.send('minimize-window')
          }>
            {' —'}
          </button>
          </div>
          <div className="color-options">
            <select 
              className="color-picker"
              value={noteColor}
              onChange={(e) => setNoteColor(e.target.value)}
            >
              <option value="#FFFF88">Yellow</option>
              <option value="#FF7EB9">Pink</option>
              <option value="#7AFCFF">Blue</option>
              <option value="#DCFF7E">Green</option>
            </select>
            
          
            <select
              className="color-picker text-color-picker"
              value={textColor}
              onChange={(e) => {
                setTextContent(e.target.value)
                setTextColor(e.target.value)
              }}
            >
              <option value="#000000">Black</option>
              <option value="#0000FF">Blue</option>
              <option value="#FF0000">Red</option>
              <option value="#008000">Green</option>
              <option value="#800080">Purple</option>
            </select>
          </div>
        </div>
      </div>
      
      <textarea
        className="note-content"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Type your note here..."
        style={{ color: textColor }} 
        autoFocus
      />
      {/* disable this temporarily */}
      {/* <div className="note-footer">
        <div className="opacity-control">
          <span>Opacity: </span>
          <input 
            type="range" 
            min="0.3" 
            max="1" 
            step="0.1"
            value={opacity}
            onChange={handleOpacityChange}
          
          />
        </div>
        
        <label className="click-through-label">
          <input 
            type="checkbox" 
            checked={isClickThrough}
            onChange={(e) => setIsClickThrough(e.target.checked)}
          />
          Click-through
        </label>
      </div> */}
    </div>
  );
}

export default App;