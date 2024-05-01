import './style.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';


// MAP INICIAL - OPEN LAYERS

const lon = 0;
const lat = 0;

var local =  new View({
    center: fromLonLat([lon, lat]),
    zoom: 2
})

const map = new Map({
    target: 'map',
    layers: [
        new TileLayer({
            source: new OSM()
        })
    ],
    view: local
});


// CHAVE API - OPEN WEATHER

const apiKey = "ed84e00c85b35b108378501e03d8e658";

// INPUT E BOTÕES DO FOOTER E MODAL PRINCIPAL

const cidadeInput = document.querySelector('#cidade-input');
const consultar = document.querySelector('#consulta-button');
const proxDias = document.querySelector('#prox-dias-btn');

// ITENS HTML - MODAL PRINCIPAL

const cidadeElemento = document.querySelector('#cidade');
const dataElemento = document.querySelector('#data');
const tempAtualElemento = document.querySelector('#temp-atual');
const tempMaxElemento = document.querySelector('#temp-max');
const tempMinElemento = document.querySelector('#temp-min');
const iconeClimaElemento = document.querySelector('#icone-clima');
const probChuvaElemento = document.querySelector('#prob-chuva');
const iconeLuaElemento = document.querySelector('#icone-lua');
const descClimalElemento = document.querySelector('#desc-clima');


// CONSULTA API'S - OPEN WEATHER E HG BRASIL 
/*
    A função consulta a Open Weather para aquisição das coordenadas Lat e Lon que serão utilizadas 
    na consulta da HG BRASIL para obter como retorno o dataHgBrasil com as informações meteorológicas.
*/

const pegarDadosTempo = async(cidade) => {
    const apiWeatherURL = `https://api.openweathermap.org/data/2.5/weather?q=${cidade}&units=metric&appid=${apiKey}&lang=pt_br`
    const res = await fetch(apiWeatherURL)
    const data = await res.json()

    const lat = data.coord.lat;
    const lon = data.coord.lon;

    const apiHgBrasil = `https://api.hgbrasil.com/weather?format=json-cors&key=5f10a682&lat=${lat}&lon=${lon}`
    const response = await fetch(apiHgBrasil)
    const dataHgBrasil = await response.json()

    return dataHgBrasil;
}

// ATUALIZAÇÃO DOS DADOS METE0ROLÓGICOS NO MODAL PRINCIPAL
/*
    A função modela o html, inserindo as informações resgatas na função pegarDadosTempo nas tags
    presente no html.
*/

const mostrarDadosTempo = async (cidade) => {
    const dataHgBrasil = await pegarDadosTempo(cidade);

    cidadeElemento.innerHTML = dataHgBrasil.results.city;
    dataElemento.innerHTML = dataHgBrasil.results.date;
    tempAtualElemento.innerHTML = dataHgBrasil.results.temp;
    descClimalElemento.innerHTML = dataHgBrasil.results.description;
    tempMaxElemento.innerHTML = dataHgBrasil.results.forecast[0].max;
    tempMinElemento.innerHTML = dataHgBrasil.results.forecast[0].min;
    iconeClimaElemento.setAttribute('src', `https://assets.hgbrasil.com/weather/icons/conditions/${dataHgBrasil.results.condition_slug}.svg`) // Link base da API HG Brasil para adquirir os SVG's das condições do tempo.
    iconeLuaElemento.setAttribute('src', `https://assets.hgbrasil.com/weather/icons/moon/${dataHgBrasil.results.moon_phase}.png`) // Link base da API HG Brasil para adquirir os PNG's das fases da lua.
    probChuvaElemento.innerHTML = dataHgBrasil.results.forecast[0].rain_probability;
    
    // Após resgatar as informações da API, o atributo display do Modal Princial é alterado para block, apresentando as informações.
    document.getElementById('modal-overlay').style.display = 'block';
    
}


// CONSULTA API - OPEN WEATHER 
/* 
    A função consulta a Open Weather para aquisição das coordenadas Lat e Lon que serão utilizadas Na função voarMapa.
*/

const pegarCoordenadas = async (cidade) => {
    const apiWeatherURL = `https://api.openweathermap.org/data/2.5/weather?q=${cidade}&units=metric&appid=${apiKey}&lang=pt_br`
    const res = await fetch(apiWeatherURL)
    const data = await res.json()

    return data;   
}

// VOAR PARA LOCALIZAÇÃO
/* 
    A função voarMapa pega as coordenadas retornadas da função pegarCoordenadas e utilizada para atualizar
    a localização no mapa. Centralizando a visualização para o ponto.
*/

const voarMapa = async (cidade) => {
    const data = await pegarCoordenadas(cidade);

    const lon = data.coord.lon;
    const lat = data.coord.lat;

    local.animate({
        center: fromLonLat([lon, lat]),
        zoom: 12, // Zoom do mapa quando posicionado.
        duration: 2000 // Duração até a localização.
    })
    
}


// ADICIONAR CIDADE NO ARMAZENAMENTO LOCAL
/*
    A função adiciona a cidade consultada para o armazenamento local, sendo possível acessar
    posteriormente através do select (selecionar-pesquisas).
*/

const adicionarConsultaAoCache = (cidade) => {
    let consultas = JSON.parse(localStorage.getItem('consultas')) || [];
    if (!consultas.includes(cidade)) {
        consultas.push(cidade);
        localStorage.setItem('consultas', JSON.stringify(consultas));
        atualizarSelect(consultas);
    }
}

/*
    A função atualiza o select com a cidade consultada armazenada localmente.
*/

const atualizarSelect = (consultas) => {
    const select = document.getElementById('selecionar-pesquisas');
    select.innerHTML = "<option disabled selected>Consultas anteriores</option>";
    consultas.forEach(cidade => {
        const option = document.createElement('option');
        option.text = cidade;
        select.add(option);
    });
}

/*
    A funçào irá carregar as consultas armazenadas localmente ao recarregar a página.
*/

window.onload = () => {
    const consultas = JSON.parse(localStorage.getItem('consultas')) || [];
    atualizarSelect(consultas);
}

const selectPesquisas = document.getElementById('selecionar-pesquisas');

/*
    A função adiciona um addEventListener no select (selecionar-pesquisas) que a cada troca para 
    consulta armazenada, irá regarregar os dados meterológicos e a posição no mapa.
*/

selectPesquisas.addEventListener('change', (event) => {
    const cidadeSelecionada = event.target.value;
    const consultas = JSON.parse(localStorage.getItem('consultas')) || [];
    
    const index = consultas.indexOf(cidadeSelecionada);
    if (index !== -1) {
        const cidade = consultas[index];
        
        mostrarDadosTempo(cidade);
        voarMapa(cidade);
        document.getElementById('modal-overlay-prox').style.display = 'none';
    }
});

/*
    A função remove as consultas armazenadas localmente e atualiza o select (selecionar-pesquisas) 
    ao clicar no botão limpar consultas (limpar-consultas-button).
*/

const limparConsultasArmazenadas = () => {
    localStorage.removeItem('consultas');
    atualizarSelect([]); // Limpa o select de pesquisas anteriores.
}

/*
    A função adiciona um addEvenetListener no botão limpar consultas (limpar-consultas-button) que
    ao clicado, limpa o armazenamento local com as pesquisas das cidades anteriores.
*/

const limparConsultasButton = document.getElementById('limpar-consultas-button');
limparConsultasButton.addEventListener("click", () => {
    limparConsultasArmazenadas();
});
   

// ACIONA AS FUNÇÕES E CRIA MODAL PRINCIPAL
/*
Adicona um addEventListener que ao clicar no botão consultar (consulta-button) aciona
as funções das API's, o reposicionamento no mapa e a adição da cidade no select (selecionar-pesquisas)
no armazenamento local.
*/

consultar.addEventListener("click", (e) => {
    e.preventDefault();
    const cidade = cidadeInput.value;
    
    mostrarDadosTempo(cidade);
    voarMapa(cidade);
    adicionarConsultaAoCache(cidade);
    document.getElementById('modal-overlay-prox').style.display = 'none'; // Ao clicar novamente, o modal dos pŕoximos dias é desligado para que em uma nova consulta não mantenha os dados da consulta anterior.
})


// CRIAÇÃO DO MODAL DOS PRÓXIMOS DIAS E ACIONAMENTO DAS FUNÇÕES DAS API'S
/*
    A função adiciona um addEventListener no botão próximos dias (prox-dias-btn) que ao clicado
    executará as funções de chamada as API's, modelagem do HTML com as informações adquiridas.
*/

proxDias.addEventListener('click', async () => {

    document.getElementById('modal-overlay-prox').style.display = 'block'; // Com o click, o modal dos próximos dias será visualizado, o atributo display será alterado para block, apresentando as informações.


    /*
        Aciona função pegarDadosTempo para obter os dados dos próximos dias.
    */
    
    const cidade = cidadeInput.value;
    const dadosProximosDias = await pegarDadosTempo(cidade);

    /*
        Preenche os dados recuperados para a sessao-prev-prox-1 (1 dia após a data da pesquisa).
    */
    
    const iconeClimaProx1 = document.querySelector('#icone-clima-prox-1');
    const dataPrevProx1 = document.querySelector('#data-prev-prox-1');
    const tempMaxProx1 = document.querySelector('#temp-max-prox-1');
    const tempMinProx1 = document.querySelector('#temp-min-prox-1');
    const probChuvaProx1 = document.querySelector('#prob-chuva-prox-1');
    const diaSemProx1 = document.querySelector('#dia-sem-prox-1');
    const tipoClimaProx1 = document.querySelector('#desc-clima-prox-1');

    iconeClimaProx1.setAttribute('src', `https://assets.hgbrasil.com/weather/icons/conditions/${dadosProximosDias.results.forecast[1].condition}.svg`);
    dataPrevProx1.innerHTML = dadosProximosDias.results.forecast[1].date + '/2024';
    tempMaxProx1.innerHTML = dadosProximosDias.results.forecast[1].max;
    tempMinProx1.innerHTML = dadosProximosDias.results.forecast[1].min;
    probChuvaProx1.innerHTML = dadosProximosDias.results.forecast[1].rain_probability;
    diaSemProx1.innerHTML = dadosProximosDias.results.forecast[1].weekday;
    tipoClimaProx1.innerHTML = dadosProximosDias.results.forecast[1].description;

    /*
        Preenche os dados recuperados para a sessao-prev-prox-2 (2 dias após a data da pesquisa).
    */

    const iconeClimaProx2 = document.querySelector('#icone-clima-prox-2');
    const dataPrevProx2 = document.querySelector('#data-prev-prox-2');
    const tempMaxProx2 = document.querySelector('#temp-max-prox-2');
    const tempMinProx2 = document.querySelector('#temp-min-prox-2');
    const probChuvaProx2 = document.querySelector('#prob-chuva-prox-2');
    const diaSemProx2 = document.querySelector('#dia-sem-prox-2');
    const tipoClimaProx2 = document.querySelector('#desc-clima-prox-2');

    iconeClimaProx2.setAttribute('src', `https://assets.hgbrasil.com/weather/icons/conditions/${dadosProximosDias.results.forecast[2].condition}.svg`);
    dataPrevProx2.innerHTML = dadosProximosDias.results.forecast[2].date + '/2024';
    tempMaxProx2.innerHTML = dadosProximosDias.results.forecast[2].max;
    tempMinProx2.innerHTML = dadosProximosDias.results.forecast[2].min;
    probChuvaProx2.innerHTML = dadosProximosDias.results.forecast[2].rain_probability;
    diaSemProx2.innerHTML = dadosProximosDias.results.forecast[2].weekday;
    tipoClimaProx2.innerHTML = dadosProximosDias.results.forecast[2].description;

    /*
        Preenche os dados recuperados para a sessao-prev-prox-3 (3 dias após a data da pesquisa).
    */
    
    const iconeClimaProx3 = document.querySelector('#icone-clima-prox-3');
    const dataPrevProx3 = document.querySelector('#data-prev-prox-3');
    const tempMaxProx3 = document.querySelector('#temp-max-prox-3');
    const tempMinProx3 = document.querySelector('#temp-min-prox-3');
    const probChuvaProx3 = document.querySelector('#prob-chuva-prox-3');
    const diaSemProx3 = document.querySelector('#dia-sem-prox-3');
    const tipoClimaProx3 = document.querySelector('#desc-clima-prox-3');

    iconeClimaProx3.setAttribute('src', `https://assets.hgbrasil.com/weather/icons/conditions/${dadosProximosDias.results.forecast[3].condition}.svg`);
    dataPrevProx3.innerHTML = dadosProximosDias.results.forecast[3].date + '/2024';
    tempMaxProx3.innerHTML = dadosProximosDias.results.forecast[3].max;
    tempMinProx3.innerHTML = dadosProximosDias.results.forecast[3].min;
    probChuvaProx3.innerHTML = dadosProximosDias.results.forecast[3].rain_probability;
    diaSemProx3.innerHTML = dadosProximosDias.results.forecast[3].weekday;
    tipoClimaProx3.innerHTML = dadosProximosDias.results.forecast[3].description;
    
});
