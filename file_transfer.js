class Iterator {
    constructor (JSON_DATA) {
        this.internal_index = 0;
        this.iterator_index = JSON_DATA.I;
        this.repeat = JSON_DATA.repeat;

        this.call_promise(this.repeat);
    }

    call_promise (re) {
        const promesa1 = new Promise((resolve, reject) => {
            re(resolve)
        })
        promesa1.then(() => {
            if (this.internal_index <= this.iterator_index) {
                this.internal_index++;
                this.recall_promise();    
            } else {
                console.log("Se ha Completado");
            }
        })
    }

    recall_promise() {
        if (this.internal_index <= this.iterator_index) {
            this.call_promise(this.repeat);
        } else {
            console.log("Se ha Completado");
        }
    }

}

class ProgressBar {
    constructor (DATA_JSON) {
       this.Status = 0;
    }

    create_ProgressBar (HTML_TAG) {
        let barra = document.createElement("div");
        let progreso = document.createElement("div");

        barra.setAttribute("class", "Progressbar");
        progreso.setAttribute("class", "LoadProgress");

        barra.appendChild(progreso);

        let selected_object = document.querySelector(HTML_TAG);
        selected_object.appendChild(barra);


        // hacemos un metodo para actualizar
        progreso.update = (p) => {
            this.update_ProgressBar(p, progreso);
        }
        progreso.color = (p) => {
            progreso.style.background = p;
                
        }
        return progreso;
    }

    update_ProgressBar (percentaje, selected_progress_bar) {
        selected_progress_bar.style.width = `${percentaje}%`;
    }
}

class FileTransfer {
    constructor(DATA) {
        this.T_FILE = [];
        
        // Accedemos a la barra de progreso
        let PB = new ProgressBar({});
        this.barra = PB.create_ProgressBar("#barra_de_progreso");
    }

    clear_saved_file () {
        this.T_FILE = [];
    }
    
    init () {
        // Este metodo inicia el objeto
        this.find_form();
    }

    find_form () {
        let form = document.querySelector("form");
        let file_input = form.querySelector('input[type="file"]');
        
        return file_input.files;
    }

    // Lee la imagen y devuelve a traves de un callback la imagen como URL/binario
    read_file (file, callback) {
        let reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onloadend = () => {
            callback({
                cod: 1,
                result: reader.result
            })
        }

        reader.onerror = () => {
            callback({
                cod: 2,
                result: null
            })
        }
    }

    // lo que quiero hacer con esto es que me corte un archivo en pedacitos URL/binarios
    // pequeños que pueda mandar por xmlhttprequest 
    cut_by_pieces (file, buffer, callback) {
        this.clear_saved_file();
        // Reiniciamos la barra de progreso a 0
        this.barra.update(0);
        this.barra.color("#f1c40f") // Este es amarillo

        // Verificamos si el buffer fue ingresado en la llamada de la funcion
        buffer = (buffer != null) ? buffer : 400;
        
        // Declaramos las variables necesarias para poder operar
        let chunks = Math.ceil(file.size / buffer);
        let pointer_low = 0;
        let pointer_high = buffer;
        
        


        for (let i = 0; i < chunks; i++) {
            // Actualizamos los valores de esta manera para evitar que se estropeen los punteros
            pointer_low = buffer*i;
            pointer_high = buffer + (buffer*i);

            let trimed = file.slice(pointer_low, pointer_high)
            this.read_file(trimed, (t) => {
                this.T_FILE.push(t.result);

                if (this.T_FILE.length == chunks) {
                    callback(this.T_FILE);
                } else {
                    // Vamos a calcular el porcentaje que tendriamos de una forma rudimentaria
                    let percent = (this.T_FILE.length / (chunks-1)) * 100;
                    this.barra.update(percent);
                }
            })
        }
       

        

    }

    // Con este metodo lo que hacemos es ir enviando pieza por pieza del achivo 
    send_file_by_pieces (piece, callback) {
        let form = new FormData();
        form.append("img", piece);

        let xhr = new XMLHttpRequest();
        xhr.open("POST", "modules/file_transfer/file_transfer.php");
        xhr.onload = (a) => {
            callback();
        }
        xhr.send(form);
    }
}

// Creamos el objeto para procesar los archivos y lo iniciamos
let FT = new FileTransfer();
FT.init();


let a = () => {
    let submit = document.querySelector('form input[type="submit"]');
    submit.addEventListener("click", (e) => {
        e.preventDefault()
        
        let files = FT.find_form();
        for (let i = 0; i < files.length; i++) {
            //  Este bucle hay que hacerlo async
            let BlobFile = files[i];
            FT.read_file(
                BlobFile, 
                (response) => {
                    if (response.cod == 1) {
                        // lo que hacemos es simplemente cargar un preview
                        let contenedor = document.createElement("div");
                        contenedor.style.backgroundImage = `url(${response.result})`;
                        document.querySelector(".uploaded").appendChild(contenedor)

                        // Aqui lo que vamos a hacer es cortar el archivo en pequeños pedazos 
                        FT.cut_by_pieces(BlobFile, 1000000, (archivo_cortado) => {
                            let index = 0;
                            new Iterator({
                                I: archivo_cortado.length,
                                repeat: (resolver_) => {
                                    FT.send_file_by_pieces(archivo_cortado[index], () => { resolver_() })       
                                    let percent = Math.ceil((index / archivo_cortado.length) * 100);
                                    
                                    FT.barra.color("#2980b9");
                                    FT.barra.update(percent);
                                    
                                    if (percent < 100) {
                                        document.querySelector("p.message").innerText = `Cargando ${percent}%`;
                                    } else {
                                        document.querySelector("p.message").innerText = `Carga Completada Correctamente `;
                                    }
                                    index+=1;
                                }
                            })
                        });
                    } else {
                        console.log("Hubo un error al enviar el archivo");
                    }
                }
            );
        }

    });
}

let b = () => {
    let submit = document.querySelector('form input[type="submit"]');
    submit.addEventListener("click", (e) => {
        e.preventDefault()
        
        let files = FT.find_form();
        let NO_FILE = 0;
        
        new Iterator({
            I: files.length,
            repeat: (resolver_upper) => {

                let BlobFile = files[NO_FILE];
                FT.read_file(
                    BlobFile, 
                    (response) => {
                        if (response.cod == 1) {
                            // lo que hacemos es simplemente cargar un preview
                            let contenedor = document.createElement("div");
                            contenedor.style.backgroundImage = `url(${response.result})`;
                            document.querySelector(".uploaded").appendChild(contenedor)

                            // Aqui lo que vamos a hacer es cortar el archivo en pequeños pedazos 
                            FT.cut_by_pieces(BlobFile, 1000000, (archivo_cortado) => {
                                let index = 0;
                                new Iterator({
                                    I: archivo_cortado.length,
                                    repeat: (resolver_) => {
                                        FT.send_file_by_pieces(archivo_cortado[index], () => { resolver_() })       
                                        let percent = Math.ceil((index / archivo_cortado.length) * 100);
                                        
                                        FT.barra.color("#2980b9");
                                        FT.barra.update(percent);
                                        
                                        if (percent < 100) {
                                            document.querySelector("p.message").innerText = `${NO_FILE}/${files.length} Cargando ${percent}%`;
                                        } else {
                                            // document.querySelector("p.message").innerText = `Carga Completada Correctamente `;
                                                console.log(files.length)
                                                console.log(NO_FILE)
                                            if (NO_FILE < files.length-1) {
                                                NO_FILE++;
                                                resolver_upper()
                                            } else {
                                                document.querySelector("p.message").innerText = `Se han cargado correctamente ${files.length} Archivos`;
                                            }
                                        }
                                        index+=1;
                                    }
                                })
                            });
                        } else {
                            console.log("Hubo un error al enviar el archivo");
                        }
                    }
                );
            }
        })

    });
}
document.addEventListener("DOMContentLoaded", b());