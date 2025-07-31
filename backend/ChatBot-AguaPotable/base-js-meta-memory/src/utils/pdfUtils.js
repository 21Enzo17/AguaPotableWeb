async function base64ToPdf(numeroServicio) {
  return new Promise((resolve, reject) => {
    fetch(
      "http://192.168.193.47:9999/ApiNoticias/RecuperarLiquidaciones?servicioNro=" +
        numeroServicio
    )
      .then((response) => response.json())
      .then((result) => {
        resolve(result.url);
      })
      .catch((error) => reject(error));
  });
}

export { base64ToPdf };


async function nroservice(nroServicio, email) {
  fetch(
    "http://192.168.193.47:9999/ApiNoticias/AltaCorreoWpp/" +
      nroServicio +
      "-" +
      email
  )
    .then((response) => response.json())
    .then((result) => console.log(result))
    .catch((error) => console.error(error));
}

export { nroservice };
