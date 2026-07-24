import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo,
  Redo,
  Palette,
  Highlighter,
} from 'lucide-react';

const FONT_FAMILIES = [
  'Inter',
  'Poppins',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Nunito',
  'Arial',
  'Georgia',
  'Courier New',
  'Times New Roman',
  'Verdana'
];

const FONT_SIZES = [
  '12px', '14px', '16px', '18px', '20px',
  '24px', '28px', '32px', '36px', '40px', '48px', '64px'
];

const BRAND_COLORS = [
  '#000000', '#1e293b', '#475569', '#dc2626', '#ea580c',
  '#d97706', '#059669', '#2563eb', '#4f46e5', '#7c3aed'
];

const HIGHLIGHT_COLORS = [
  'transparent', '#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#fed7aa'
];

/**
 * Universal Reusable Rich Text Editor Component
 * Robust toolbar supporting text formatting, font family, font sizes, custom colors,
 * lists, headings, links, and custom Undo/Redo stack.
 */
const RichTextEditor = ({
  value = '',
  onChange = () => {},
  placeholder = 'Enter content here...',
  minHeight = '160px',
  className = ''
}) => {
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);

  // Custom Undo/Redo History Stack
  const historyRef = useRef([value || '']);
  const historyIndexRef = useRef(0);
  const isUndoRedoAction = useRef(false);

  const [selectedHeading, setSelectedHeading] = useState('p');
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [selectedSize, setSelectedSize] = useState('16px');
  const [textColor, setTextColor] = useState('#1e293b');
  const [bgColor, setBgColor] = useState('transparent');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [customColor, setCustomColor] = useState('#000000');

  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false
  });

  // Enable inline CSS mode for formatting
  const enableStyleWithCSS = () => {
    try {
      document.execCommand('styleWithCSS', false, true);
    } catch (e) {}
  };

  // Convert camelCase style name to kebab-case
  const camelToKebab = (str) => {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  };

  // Helper to convert rgb(r, g, b) to hex #rrggbb
  const rgbToHex = (rgb) => {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return null;
    if (rgb.startsWith('#')) return rgb;
    const matches = rgb.match(/\d+/g);
    if (!matches || matches.length < 3) return null;
    const r = parseInt(matches[0], 10).toString(16).padStart(2, '0');
    const g = parseInt(matches[1], 10).toString(16).padStart(2, '0');
    const b = parseInt(matches[2], 10).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  };

  // Helper to check if HTML contains only empty whitespace/tags
  const isHtmlEmpty = (html) => {
    if (!html) return true;
    const stripped = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();
    return stripped.length === 0;
  };

  // Clean container styles and convert old font tags to span inline styles
  const cleanAndNormalizeHtml = () => {
    if (!editorRef.current) return;

    // 1. Remove inline styles applied accidentally to root container div
    if (editorRef.current.style.color) editorRef.current.style.color = '';
    if (editorRef.current.style.fontSize) editorRef.current.style.fontSize = '';
    if (editorRef.current.style.fontFamily) editorRef.current.style.fontFamily = '';
    if (editorRef.current.style.backgroundColor) editorRef.current.style.backgroundColor = '';

    // 2. Convert old <font> tags into <span style="..."> tags
    const fontElems = Array.from(editorRef.current.querySelectorAll('font'));
    fontElems.forEach((fontEl) => {
      const span = document.createElement('span');
      const styleArr = [];
      if (fontEl.hasAttribute('face')) styleArr.push(`font-family: ${fontEl.getAttribute('face')}`);
      if (fontEl.hasAttribute('color')) styleArr.push(`color: ${fontEl.getAttribute('color')}`);
      if (fontEl.hasAttribute('size')) {
        const sizeAttr = fontEl.getAttribute('size');
        const sizeMap = { '1': '12px', '2': '14px', '3': '16px', '4': '18px', '5': '24px', '6': '32px', '7': '48px' };
        styleArr.push(`font-size: ${sizeMap[sizeAttr] || '16px'}`);
      }
      if (styleArr.length > 0) {
        span.setAttribute('style', styleArr.join('; '));
      }
      while (fontEl.firstChild) {
        span.appendChild(fontEl.firstChild);
      }
      fontEl.parentNode.replaceChild(span, fontEl);
    });
  };

  // Sync value from prop to editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (!value && isHtmlEmpty(editorRef.current.innerHTML)) {
        return;
      }
      editorRef.current.innerHTML = value || '';
      cleanAndNormalizeHtml();
    }
  }, [value]);

  // Push new state to history stack
  const pushToHistory = (newHtml) => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    const currentStack = historyRef.current.slice(0, historyIndexRef.current + 1);
    if (currentStack[currentStack.length - 1] !== newHtml) {
      currentStack.push(newHtml);
      historyRef.current = currentStack;
      historyIndexRef.current = currentStack.length - 1;
    }
  };

  // Custom Undo Handler
  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const prevHtml = historyRef.current[historyIndexRef.current] || '';
      isUndoRedoAction.current = true;
      if (editorRef.current) {
        editorRef.current.innerHTML = prevHtml;
      }
      onChange(prevHtml);
    }
  };

  // Custom Redo Handler
  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const nextHtml = historyRef.current[historyIndexRef.current] || '';
      isUndoRedoAction.current = true;
      if (editorRef.current) {
        editorRef.current.innerHTML = nextHtml;
      }
      onChange(nextHtml);
    }
  };

  // Save current selection range before toolbar action
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  };

  // Restore selection range to editor
  const restoreSelection = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      if (sel) {
        try {
          sel.removeAllRanges();
          sel.addRange(savedRangeRef.current);
        } catch (e) {}
      }
    }
  };

  // Update active formatting states for current selection/cursor position
  const updateActiveStates = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    let node = sel.anchorNode;
    if (!node || !editorRef.current || !editorRef.current.contains(node)) return;
    if (node.nodeType === 3) node = node.parentNode;

    try {
      setActiveStyles({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikethrough: document.queryCommandState('strikeThrough')
      });

      const computed = window.getComputedStyle(node);

      // Detect Color
      if (computed.color) {
        const hex = rgbToHex(computed.color);
        if (hex) setTextColor(hex);
      }

      // Detect Font Size
      if (computed.fontSize) {
        const px = Math.round(parseFloat(computed.fontSize)) + 'px';
        if (FONT_SIZES.includes(px)) {
          setSelectedSize(px);
        }
      }

      // Detect Font Family
      if (computed.fontFamily) {
        const cleanFont = computed.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
        const matched = FONT_FAMILIES.find(f => f.toLowerCase() === cleanFont.toLowerCase());
        if (matched) setSelectedFont(matched);
      }

      // Detect Heading tag
      let cur = node;
      let foundTag = 'p';
      while (cur && cur !== editorRef.current) {
        const tag = cur.tagName ? cur.tagName.toLowerCase() : '';
        if (['h1', 'h2', 'h3', 'h4', 'p'].includes(tag)) {
          foundTag = tag;
          break;
        }
        cur = cur.parentNode;
      }
      setSelectedHeading(foundTag);
    } catch (e) {}
  };

  // Helper to insert a zero-width space span for future typing
  const applyStyleToCursor = (styleProp, styleVal) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    let node = range.commonAncestorContainer;
    if (node.nodeType === 3) node = node.parentNode;

    if (node && node !== editorRef.current && node.tagName === 'SPAN') {
      node.style[styleProp] = styleVal;
    } else {
      const span = document.createElement('span');
      span.style[styleProp] = styleVal;
      const textNode = document.createTextNode('\u200B'); // zero-width space
      span.appendChild(textNode);
      range.insertNode(span);

      const newRange = document.createRange();
      newRange.setStart(textNode, 1);
      newRange.setCollapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }
  };

  // Universal style applicator: applies to highlighted text, or existing editor text, or cursor
  const applyStyleToSelectionOrContainer = (styleProp, styleVal, execCmdName = null, execCmdVal = null) => {
    restoreSelection();
    enableStyleWithCSS();

    const sel = window.getSelection();
    const hasSelection = sel && sel.rangeCount > 0 && !sel.isCollapsed;

    if (hasSelection) {
      if (execCmdName) {
        document.execCommand(execCmdName, false, execCmdVal !== null ? execCmdVal : styleVal);
        if (styleProp === 'fontSize') {
          const fontElems = editorRef.current.querySelectorAll('font[size="7"], span[style*="xx-large"], [size="7"]');
          fontElems.forEach((el) => {
            const span = document.createElement('span');
            span.style.fontSize = styleVal;
            while (el.firstChild) span.appendChild(el.firstChild);
            el.parentNode.replaceChild(span, el);
          });
        }
        cleanAndNormalizeHtml();
      } else {
        try {
          const range = sel.getRangeAt(0);
          const span = document.createElement('span');
          span.style[styleProp] = styleVal;
          span.appendChild(range.extractContents());
          range.insertNode(span);
        } catch (e) {}
      }
    } else if (editorRef.current) {
      const rawText = editorRef.current.innerText || editorRef.current.textContent || '';
      if (rawText.trim().length > 0) {
        const spans = editorRef.current.querySelectorAll('span');
        if (spans.length > 0) {
          spans.forEach((sp) => {
            sp.style[styleProp] = styleVal;
          });
        } else {
          editorRef.current.innerHTML = `<span style="${camelToKebab(styleProp)}: ${styleVal}">${editorRef.current.innerHTML}</span>`;
        }
      } else {
        applyStyleToCursor(styleProp, styleVal);
      }
    }

    saveSelection();
    handleInput();
  };

  // Trigger onChange with sanitized HTML
  const handleInput = () => {
    saveSelection();
    if (!editorRef.current) return;

    cleanAndNormalizeHtml();
    const currentHtml = editorRef.current.innerHTML;

    pushToHistory(currentHtml);

    if (isHtmlEmpty(currentHtml)) {
      onChange('');
    } else {
      onChange(currentHtml);
    }

    updateActiveStates();
  };

  // Prevent blur on toolbar button click
  const preventBlur = (e) => {
    e.preventDefault();
    saveSelection();
  };

  // Generic Command Executor
  const executeCommand = (command, value = null) => {
    restoreSelection();
    enableStyleWithCSS();
    document.execCommand(command, false, value);
    saveSelection();
    handleInput();
  };

  // Toggle Styles (Bold, Italic, Underline, Strikethrough)
  const handleToggleStyle = (type) => {
    restoreSelection();
    enableStyleWithCSS();

    const sel = window.getSelection();
    const hasSelection = sel && sel.rangeCount > 0 && !sel.isCollapsed;

    if (hasSelection) {
      if (type === 'bold') document.execCommand('bold', false, null);
      if (type === 'italic') document.execCommand('italic', false, null);
      if (type === 'underline') document.execCommand('underline', false, null);
      if (type === 'strikeThrough') document.execCommand('strikeThrough', false, null);
    } else if (editorRef.current) {
      const rawText = editorRef.current.innerText || editorRef.current.textContent || '';
      if (rawText.trim().length > 0) {
        if (type === 'bold') {
          if (activeStyles.bold) {
            document.execCommand('selectAll', false, null);
            document.execCommand('bold', false, null);
          } else {
            editorRef.current.innerHTML = `<strong>${editorRef.current.innerHTML}</strong>`;
          }
        }
        if (type === 'italic') {
          if (activeStyles.italic) {
            document.execCommand('selectAll', false, null);
            document.execCommand('italic', false, null);
          } else {
            editorRef.current.innerHTML = `<em>${editorRef.current.innerHTML}</em>`;
          }
        }
        if (type === 'underline') {
          if (activeStyles.underline) {
            document.execCommand('selectAll', false, null);
            document.execCommand('underline', false, null);
          } else {
            editorRef.current.innerHTML = `<u>${editorRef.current.innerHTML}</u>`;
          }
        }
        if (type === 'strikeThrough') {
          if (activeStyles.strikethrough) {
            document.execCommand('selectAll', false, null);
            document.execCommand('strikeThrough', false, null);
          } else {
            editorRef.current.innerHTML = `<strike>${editorRef.current.innerHTML}</strike>`;
          }
        }
      } else {
        if (type === 'bold') document.execCommand('bold', false, null);
        if (type === 'italic') document.execCommand('italic', false, null);
        if (type === 'underline') document.execCommand('underline', false, null);
        if (type === 'strikeThrough') document.execCommand('strikeThrough', false, null);
      }
    }

    saveSelection();
    handleInput();
  };

  // Lists Handler (Bullet List & Numbered List)
  const handleList = (listType) => {
    restoreSelection();
    enableStyleWithCSS();
    const cmd = listType === 'unordered' ? 'insertUnorderedList' : 'insertOrderedList';
    document.execCommand(cmd, false, null);
    saveSelection();
    handleInput();
  };

  // Font Family Apply
  const handleFontChange = (font) => {
    setSelectedFont(font);
    applyStyleToSelectionOrContainer('fontFamily', font, 'fontName', font);
  };

  // Font Size Apply
  const handleSizeChange = (size) => {
    setSelectedSize(size);
    applyStyleToSelectionOrContainer('fontSize', size, 'fontSize', '7');
  };

  // Headings Format
  const handleHeadingChange = (tag) => {
    setSelectedHeading(tag);
    restoreSelection();
    enableStyleWithCSS();
    try {
      document.execCommand('formatBlock', false, `<${tag}>`);
    } catch (e) {
      document.execCommand('formatBlock', false, tag);
    }
    saveSelection();
    handleInput();
  };

  // Apply Text Color
  const applyTextColor = (color) => {
    setTextColor(color);
    setShowColorPicker(false);
    applyStyleToSelectionOrContainer('color', color, 'foreColor', color);
  };

  // Apply Highlight Color
  const applyHighlightColor = (color) => {
    setBgColor(color);
    setShowHighlightPicker(false);
    const cmd = document.queryCommandSupported('hiliteColor') ? 'hiliteColor' : 'backColor';
    applyStyleToSelectionOrContainer('backgroundColor', color, cmd, color);
  };

  // Link Modal Insert
  const insertLink = () => {
    if (linkUrl) {
      executeCommand('createLink', linkUrl);
      setLinkUrl('');
      setShowLinkModal(false);
    }
  };

  return (
    <div className={`rich-text-editor-container bg-white border border-slate-300 rounded-lg shadow-sm relative ${className}`}>
      {/* Editor Scoped CSS */}
      <style>{`
        .rich-text-editor-canvas ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin: 0.5rem 0 !important;
          display: block !important;
        }
        .rich-text-editor-canvas ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin: 0.5rem 0 !important;
          display: block !important;
        }
        .rich-text-editor-canvas li {
          margin: 0.25rem 0 !important;
          display: list-item !important;
        }
        .rich-text-editor-canvas h1 {
          font-size: 2.25rem !important;
          font-weight: 800 !important;
          margin: 0.5rem 0 !important;
        }
        .rich-text-editor-canvas h2 {
          font-size: 1.75rem !important;
          font-weight: 700 !important;
          margin: 0.5rem 0 !important;
        }
        .rich-text-editor-canvas h3 {
          font-size: 1.35rem !important;
          font-weight: 700 !important;
          margin: 0.5rem 0 !important;
        }
        .rich-text-editor-canvas h4 {
          font-size: 1.1rem !important;
          font-weight: 600 !important;
          margin: 0.25rem 0 !important;
        }
        .rich-text-editor-canvas u {
          text-decoration: underline !important;
        }
        .rich-text-editor-canvas s, .rich-text-editor-canvas strike {
          text-decoration: line-through !important;
        }
        .rich-text-editor-canvas a {
          color: #2563eb !important;
          text-decoration: underline !important;
        }
      `}</style>

      {/* Toolbar */}
      <div 
        className="toolbar flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border-b border-slate-200 text-slate-700 text-xs select-none rounded-t-lg"
      >
        {/* Undo / Redo */}
        <button type="button" onMouseDown={preventBlur} onClick={handleUndo} title="Undo (Ctrl+Z)" className="p-1.5 hover:bg-slate-200 rounded cursor-pointer">
          <Undo size={15} />
        </button>
        <button type="button" onMouseDown={preventBlur} onClick={handleRedo} title="Redo (Ctrl+Y)" className="p-1.5 hover:bg-slate-200 rounded cursor-pointer">
          <Redo size={15} />
        </button>

        <span className="w-[1px] h-4 bg-slate-300 mx-1"></span>

        {/* Heading Dropdown */}
        <select
          value={selectedHeading}
          onMouseDown={saveSelection}
          onChange={(e) => handleHeadingChange(e.target.value)}
          className="bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none cursor-pointer"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>

        {/* Font Family Dropdown */}
        <select
          value={selectedFont}
          onMouseDown={saveSelection}
          onChange={(e) => handleFontChange(e.target.value)}
          className="bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none cursor-pointer font-medium"
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
          ))}
        </select>

        {/* Font Size Dropdown */}
        <select
          value={selectedSize}
          onMouseDown={saveSelection}
          onChange={(e) => handleSizeChange(e.target.value)}
          className="bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none cursor-pointer font-medium"
        >
          {FONT_SIZES.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>

        <span className="w-[1px] h-4 bg-slate-300 mx-1"></span>

        {/* Formatting Buttons */}
        <button 
          type="button" 
          onMouseDown={preventBlur} 
          onClick={() => handleToggleStyle('bold')} 
          title="Bold" 
          className={`p-1.5 hover:bg-slate-200 rounded font-bold cursor-pointer transition-colors ${activeStyles.bold ? 'bg-slate-200 text-emerald-700 font-extrabold' : ''}`}
        >
          <Bold size={15} />
        </button>
        <button 
          type="button" 
          onMouseDown={preventBlur} 
          onClick={() => handleToggleStyle('italic')} 
          title="Italic" 
          className={`p-1.5 hover:bg-slate-200 rounded italic cursor-pointer transition-colors ${activeStyles.italic ? 'bg-slate-200 text-emerald-700' : ''}`}
        >
          <Italic size={15} />
        </button>
        <button 
          type="button" 
          onMouseDown={preventBlur} 
          onClick={() => handleToggleStyle('underline')} 
          title="Underline" 
          className={`p-1.5 hover:bg-slate-200 rounded underline cursor-pointer transition-colors ${activeStyles.underline ? 'bg-slate-200 text-emerald-700' : ''}`}
        >
          <Underline size={15} />
        </button>
        <button 
          type="button" 
          onMouseDown={preventBlur} 
          onClick={() => handleToggleStyle('strikeThrough')} 
          title="Strikethrough" 
          className={`p-1.5 hover:bg-slate-200 rounded line-through cursor-pointer transition-colors ${activeStyles.strikethrough ? 'bg-slate-200 text-emerald-700' : ''}`}
        >
          <Strikethrough size={15} />
        </button>

        <span className="w-[1px] h-4 bg-slate-300 mx-1"></span>

        {/* Text Color Picker */}
        <div className="relative">
          <button 
            type="button" 
            onMouseDown={preventBlur}
            onClick={() => setShowColorPicker(!showColorPicker)} 
            title="Text Color" 
            className="p-1.5 hover:bg-slate-200 rounded flex items-center gap-1 cursor-pointer"
          >
            <Palette size={15} style={{ color: textColor }} />
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 sm:left-0 mt-1 p-2 bg-white border border-slate-200 shadow-xl rounded-lg z-30 flex flex-col gap-2 min-w-[160px]">
              <div className="grid grid-cols-5 gap-1.5">
                {BRAND_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onMouseDown={preventBlur}
                    onClick={() => applyTextColor(c)}
                    className="w-5 h-5 rounded border border-slate-300 hover:scale-110 transition cursor-pointer"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5 border-t pt-1.5 text-[10px]">
                <input 
                  type="color" 
                  value={customColor} 
                  onChange={(e) => setCustomColor(e.target.value)} 
                  className="w-5 h-5 cursor-pointer rounded border-0 p-0" 
                />
                <button
                  type="button"
                  onMouseDown={preventBlur}
                  onClick={() => applyTextColor(customColor)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-0.5 rounded font-medium text-center cursor-pointer"
                >
                  Apply Color
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Highlight Color Picker */}
        <div className="relative">
          <button 
            type="button" 
            onMouseDown={preventBlur}
            onClick={() => setShowHighlightPicker(!showHighlightPicker)} 
            title="Highlight Color" 
            className="p-1.5 hover:bg-slate-200 rounded flex items-center gap-1 cursor-pointer"
          >
            <Highlighter size={15} />
          </button>
          {showHighlightPicker && (
            <div className="absolute top-full left-0 sm:left-0 mt-1 p-2 bg-white border border-slate-200 shadow-xl rounded-lg z-30 grid grid-cols-6 gap-1.5 min-w-[160px]">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onMouseDown={preventBlur}
                  onClick={() => applyHighlightColor(c)}
                  className="w-5 h-5 rounded border border-slate-300 hover:scale-110 transition cursor-pointer flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: c === 'transparent' ? '#fff' : c }}
                  title={c}
                >
                  {c === 'transparent' && '×'}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="w-[1px] h-4 bg-slate-300 mx-1"></span>

        {/* Lists */}
        <button type="button" onMouseDown={preventBlur} onClick={() => handleList('unordered')} title="Bullet List" className="p-1.5 hover:bg-slate-200 rounded cursor-pointer">
          <List size={15} />
        </button>
        <button type="button" onMouseDown={preventBlur} onClick={() => handleList('ordered')} title="Numbered List" className="p-1.5 hover:bg-slate-200 rounded cursor-pointer">
          <ListOrdered size={15} />
        </button>

        <span className="w-[1px] h-4 bg-slate-300 mx-1"></span>

        {/* Link */}
        <button type="button" onMouseDown={preventBlur} onClick={() => setShowLinkModal(true)} title="Insert Link" className="p-1.5 hover:bg-slate-200 rounded cursor-pointer">
          <LinkIcon size={15} />
        </button>
      </div>

      {/* Editable Canvas */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        onKeyUp={() => {
          saveSelection();
          updateActiveStates();
        }}
        onMouseUp={() => {
          saveSelection();
          updateActiveStates();
        }}
        onFocus={() => {
          enableStyleWithCSS();
          saveSelection();
          updateActiveStates();
        }}
        style={{ minHeight }}
        className="rich-text-editor-canvas p-4 focus:outline-none text-slate-800 text-sm overflow-y-auto"
        placeholder={placeholder}
      />

      {/* Modal: Link */}
      {showLinkModal && (
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex gap-2 items-center text-xs">
          <input
            type="url"
            className="flex-1 p-1.5 border rounded"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
          <button type="button" onClick={insertLink} className="bg-emerald-700 text-white px-3 py-1.5 rounded font-medium">Add Link</button>
          <button type="button" onClick={() => setShowLinkModal(false)} className="text-slate-500 px-2">Cancel</button>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
