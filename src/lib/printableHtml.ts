const printStyles = `
  <style>
    @media print {
      @page { size: A4; margin: 12mm; }
      body { background: white !important; }
      .print-controls { display: none !important; }
    }

    .print-controls {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 100;
    }

    .print-controls button {
      background: #6366f1;
      color: white;
      border: 0;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .print-controls button:hover {
      background: #4f46e5;
    }
  </style>
`;

const printControls = `
  <div class="print-controls">
    <button type="button" onclick="window.print()">Enregistrer en PDF</button>
  </div>
  <script>
    window.addEventListener("load", () => {
      window.setTimeout(() => window.print(), 500);
    });
  </script>
`;

export function withPrintableControls(html: string): string {
  return html
    .replace("</head>", `${printStyles}</head>`)
    .replace("<body>", `<body>${printControls}`);
}
