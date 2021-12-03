const cors = require("cors");
const cheerio = require("cheerio");
const axios = require("axios");
const express = require("express");

const PORT = 5000;
const app = express();
const urls = [
  "https://alojamento.aaue.pt/index.php?page=search",
  "https://alojamento.aaue.pt/index.php?page=search&iPage=2",
  "https://alojamento.aaue.pt/index.php?page=search&iPage=3",
  "https://alojamento.aaue.pt/index.php?page=search&iPage=4",
  "https://alojamento.aaue.pt/index.php?page=search&iPage=5",
  "https://alojamento.aaue.pt/index.php?page=search&iPage=6",
];
let anuncios = [];
let totalDeAnuncios = 0;

cors({
  origin: true,
});

const getAllListingsFromAlojamento = () => {
  urls.forEach((element) => {
    getUrlsFromPage(element);
  });

  totalDeAnuncios = anuncios.length;
};

const getUrlsFromPage = (url) => {
  axios(url)
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);

      $("a.listing-thumb", html).each(function () {
        const url = $(this).attr("href");
        getDataFromListing(url);
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

const getDataFromListing = async (listingURL) => {
  const listingInfo = {
    tipo: "",
    data_de_publicacao: "",
    titulo: "",
    descricao: "",
    preco: "",
    fotos: [],
    tipologia: "",
    despesas_incluidas: false,
    genero_aceite: "",
    mobilado: false,
    sala: false,
    numero_quartos_disponiveis: "",
    numero_total_quartos: "",
    cozinha: false,
    numero_casas_banho: "",
    endereco: "",
    localidade: "",
    codigo_postal: "",
    nome_contacto: "",
    numero_contacto: "",
    email_contacto: "",
    coordenadas_gps: "",
  };

  await axios(listingURL).then((response) => {
    const html = response.data;
    const $ = cheerio.load(html);

    const tipo = $(".breadcrumb").find("span:contains('Arrendar')").text();

    listingInfo.tipo = tipo.includes("Casas") ? "Casa" : "Quarto";

    listingInfo.data_de_publicacao = $(".item-header div")
      .first()
      .text()
      .split(":")[1]
      .trim();

    const preco = $(".price").text();
    const indexOfEuroWord = preco.indexOf("Euro");
    listingInfo.preco = preco.substring(0, indexOfEuroWord).trim();

    if (!listingInfo.preco) {
      listingInfo.preco = "Verificar com vendedor";
    }

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

    const despesas_incluidas = getTextFromElement(html, "Despesas");

    listingInfo.despesas_incluidas =
      despesas_incluidas === "Não" ? false : true;

    listingInfo.genero_aceite = getTextFromElement(html, "Genero");

    listingInfo.mobilado = getBooleanFromElement(html, "Mobiliado");

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

    anuncios.push(listingInfo);
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
  let elementText = $(`.meta:contains('${element}')`).text().split(":")[1];
  if (elementText) {
    return elementText.trim();
  } else if (elementText == undefined) {
    return "";
  }
};

const sortAnuncios = () => {
  anuncios.sort((a, b) => {
    let dateA = new Date(
        parseInt(a.data_de_publicacao.substring(6)),
        parseInt(a.data_de_publicacao.substring(3, 5)),
        parseInt(a.data_de_publicacao.substring(0, 2))
      ),
      dateB = new Date(
        parseInt(b.data_de_publicacao.substring(6)),
        parseInt(b.data_de_publicacao.substring(3, 5)),
        parseInt(b.data_de_publicacao.substring(0, 2))
      );
    return dateB - dateA;
  });
};
const sortAnunciosReversed = () => {
  anuncios.sort((a, b) => {
    let dateA = new Date(
        parseInt(a.data_de_publicacao.substring(6)),
        parseInt(a.data_de_publicacao.substring(3, 5)),
        parseInt(a.data_de_publicacao.substring(0, 2))
      ),
      dateB = new Date(
        parseInt(b.data_de_publicacao.substring(6)),
        parseInt(b.data_de_publicacao.substring(3, 5)),
        parseInt(b.data_de_publicacao.substring(0, 2))
      );
    return dateA - dateB;
  });
};

getAllListingsFromAlojamento();

setInterval(() => {
  anuncios = [];
  getAllListingsFromAlojamento();
}, 1000 * 60 * 60);

/* setInterval(() => {
  let anunciosNew = [];
  urls.forEach(async (url) => {
    await axios(url)
      .then(async (response) => {
        const html = await response.data;
        const $ = cheerio.load(html);

        $("a.listing-thumb", html).each(function () {
          const url = $(this).attr("href");
          anunciosNew.push(url);
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });

  setTimeout(() => {
    anunciosNew.sort((a, b) => {
      let dateA = new Date(
          parseInt(a.data_de_publicacao.substring(6)),
          parseInt(a.data_de_publicacao.substring(3, 5)),
          parseInt(a.data_de_publicacao.substring(0, 2))
        ),
        dateB = new Date(
          parseInt(b.data_de_publicacao.substring(6)),
          parseInt(b.data_de_publicacao.substring(3, 5)),
          parseInt(b.data_de_publicacao.substring(0, 2))
        );
      return dateB - dateA;
    });

    console.log(anunciosNew.length);
    console.log(totalDeAnuncios);
    console.log(anunciosNew[0].titulo);
    console.log(anuncios[0].titulo);

    if (
      anunciosNew.length === totalDeAnuncios &&
      anunciosNew[0].titulo === anuncios[0].titulo
    ) {
      return;
    } else {
      anuncios = [];
      totalDeAnuncios = 0;
      getAllListingsFromAlojamento();
    }
  }, 20000);
}, 20000); */

app.get("/getAnuncios", (req, res) => {
  anuncios.sort((a, b) => {
    let dateA = new Date(
        parseInt(a.data_de_publicacao.substring(6)),
        parseInt(a.data_de_publicacao.substring(3, 5)),
        parseInt(a.data_de_publicacao.substring(0, 2))
      ),
      dateB = new Date(
        parseInt(b.data_de_publicacao.substring(6)),
        parseInt(b.data_de_publicacao.substring(3, 5)),
        parseInt(b.data_de_publicacao.substring(0, 2))
      );
    return dateB - dateA;
  });
  res.json(anuncios);
});

app.listen(PORT, () => {
  console.log("app is live");
});
