import { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PageFlip } from 'page-flip';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function FlipBookPDF({ url }) {
  const contenedorRef = useRef(null);
  const flipRef = useRef(null);
  const [estado, setEstado] = useState('Cargando PDF…');
  const [total, setTotal] = useState(0);
  const [actual, setActual] = useState(0);

  useEffect(() => {
    let cancelado = false;
    setEstado('Convirtiendo páginas…');
    (async () => {
      try {
        const doc = await pdfjs.getDocument(url).promise;
        const imagenes = [];
        let ratio = {
          w: 900,
          h: 1200,
        };
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const vp = page.getViewport({ scale: 1.6 });
          if (i === 1) ratio = { w: vp.width, h: vp.height };
          const canvas = document.createElement('canvas');
          canvas.width = vp.width;
          canvas.height = vp.height;
          const ctx = canvas.getContext('2d');
          await page.render({ canvasContext: ctx, viewport: vp }).promise;
          imagenes.push(canvas.toDataURL('image/jpeg', 0.9));
        }
        if (cancelado) return;
        setTotal(imagenes.length);
        if (imagenes.length === 0) {
          setEstado('El PDF no tiene páginas visibles.');
          return;
        }
        setEstado('');
        const flip = new PageFlip(contenedorRef.current, {
          width: ratio.w,
          height: ratio.h,
          size: 'stretch',
          minWidth: 220,
          maxWidth: 1600,
          minHeight: 280,
          maxHeight: 2000,
          showCover: false,
          usePortrait: true,
          flippingTime: 650,
          autoSize: true,
          startZIndex: 0,
        });
        flip.on('flip', (e) => setActual((e.data ?? 0) + 1));
        flip.loadFromImages(imagenes);
        flipRef.current = flip;
        setActual(1);
      } catch {
        if (!cancelado) setEstado('No se pudo abrir el PDF.');
      }
    })();
    return () => {
      cancelado = true;
      if (flipRef.current) {
        try {
          flipRef.current.destroy();
        } catch {
          /* ignorar */
        }
        flipRef.current = null;
      }
    };
  }, [url]);

  return (
    <div className="flipbook-wrap">
      {estado && <div className="alerta info">{estado}</div>}
      <div className="flipbook-controls">
        <button
          className="btn"
          disabled={actual <= 0}
          onClick={() => flipRef.current?.flipPrev('top')}
        >
          ‹ Anterior
        </button>
        <span>
          Página {actual} de {total}
        </span>
        <button
          className="btn"
          disabled={actual >= total}
          onClick={() => flipRef.current?.flipNext('top')}
        >
          Siguiente ›
        </button>
      </div>
      <div className="flipbook" ref={contenedorRef} />
    </div>
  );
}