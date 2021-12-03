const cors = require("cors");
const cheerio = require("cheerio");
const axios = require("axios");
const express = require("express");

const PORT = 3000;
const app = express();

cors({
  origin: true,
});

const getAllListingsFromAlojamento = async () => {
  const urls = [
    "https://alojamento.aaue.pt/index.php?page=search",
    "https://alojamento.aaue.pt/index.php?page=search&iPage=2",
    "https://alojamento.aaue.pt/index.php?page=search&iPage=3",
    "https://alojamento.aaue.pt/index.php?page=search&iPage=4",
    "https://alojamento.aaue.pt/index.php?page=search&iPage=5",
    "https://alojamento.aaue.pt/index.php?page=search&iPage=6",
  ];
  const links = [];
  urls.forEach((element) => {
    axios(element)
      .then((response) => {
        const html = response.data;
        const $ = cheerio.load(html);

        $("a.listing-thumb", html).each(function () {
          const link = $(this).attr("href");
          links.push(link);
        });
        console.log(links);
      })
      .catch((err) => {
        console.log(err);
      });
  });
  console.log("fora:" + links);
};

const getDataFromListing = (listingURL) => {
  const listingInfo = {
    tipo: "",
    titulo: "",
    descricao: "",
    preco: "",
    fotos: [],
    tipologia: "",
    despesas_incluidas: false,
    genero_aceite: "",
    mobiliado: false,
    sala: false,
    numero_quartos_disponiveis: 0,
    numero_total_quartos: 0,
    cozinha: false,
    numero_casas_banho: 3,
    endereco: "",
    localidade: "",
    codigo_postal: "",
    nome_contacto: "",
    numero_contacto: "",
    email_contacto: "",
    coordenadas_gps: "",
  };

  axios(listingURL).then((response) => {
    const html = response.data;
    const $ = cheerio.load(html);

    const tipo = $(".breadcrumb").find("span:contains('Arrendar')").text();

    listingInfo.tipo = tipo.includes("Casas") ? "Casa" : "Quarto";

    const preco = $(".price").text();
    const indexOfEuroWord = preco.indexOf("Euro");
    listingInfo.preco = preco.substring(0, indexOfEuroWord).trim();

    listingInfo.titulo = $("#item-content").find("h1 strong").text();

    listingInfo.descricao = $("#description")
      .find("p")
      .first()
      .text()
      .replace(/\r?\n|\r/g, "");

    const fotoPrincipal = $(".main-photo").attr("href");
    listingInfo.fotos.push(fotoPrincipal);

    $(".fancybox").each(function () {
      let foto = $(this).attr("href");
      listingInfo.fotos.push(foto);
    });

    if (
      listingInfo.fotos.length === 1 &&
      listingInfo.fotos.includes(undefined)
    ) {
      listingInfo.fotos[0] =
        "https://alojamento.aaue.pt/oc-content/themes/bender/images/no_photo.gif";
    }

    listingInfo.tipologia = getTextFromElement(html, "Tipologia");

    listingInfo.despesas_incluidas = getTextFromElement(html, "Despesas");

    listingInfo.genero_aceite = getTextFromElement(html, "Genero");

    listingInfo.mobiliado = getBooleanFromElement(html, "Mobiliado");

    listingInfo.sala = getBooleanFromElement(html, "Sala");

    listingInfo.numero_quartos_disponiveis = getTextFromElement(
      html,
      "Disponiveis"
    );

    listingInfo.numero_total_quartos = getTextFromElement(html, "Total");

    listingInfo.cozinha = getBooleanFromElement(html, "Cozinha");

    listingInfo.numero_casas_banho = getTextFromElement(html, "Banho");

    listingInfo.nome_contacto = $(".name").find("a").text().trim();

    let endereco = $("li:contains('Localização')")
      .text()
      .split(":")[1]
      .split(",");

    listingInfo.endereco = endereco[0];
    listingInfo.localidade = endereco[1];
    listingInfo.codigo_postal = "7000";

    console.log(listingInfo);
  });
};

const getBooleanFromElement = (html, element) => {
  const $ = cheerio.load(html);
  const tickerUrl =
    "https://alojamento.aaue.pt/oc-content/themes/bender/images/tick.png";
  const imgSrc = $(`.meta:contains('${element}')`).find("img").attr("src");

  if (imgSrc === tickerUrl) {
    return true;
  } else {
    return false;
  }
};

const getTextFromElement = (html, element) => {
  const $ = cheerio.load(html);
  // Get text from specified element, split text contents into an array,get second index which is the intended value, remove whitespaces by using trim()
  return $(`.meta:contains('${element}')`).text().split(":")[1].trim();
};

getAllListingsFromAlojamento();

app.listen(PORT, () => {
  console.log("app is live");
});
