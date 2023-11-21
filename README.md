# FileTransfer
Simplemente pretendo solucionar un problema que se presenta al cargar archivos grandes a servidores online cuando tienes un hosting limitado a 2 Mb en el volumen de transferencia


new FileTransfer({
  URL: "path/to/file",
  method: "POST",
  selected_files: archivo_seleccionado,
  update_callback: (progress) => {
      // code...
  },
  completed_callback: () => {
      // code...
  }
});
