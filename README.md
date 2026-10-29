# Juego de la Vida de Conway

## Descripción

El Juego de la Vida de Conway es un autómata celular creado por el matemático John Horton Conway. Es una simulación en la que las células evolucionan siguiendo unas reglas determinadas, sin necesidad de que el jugador intervenga durante la simulación.

Cada célula puede estar viva o muerta, y su estado cambia en función de las células vecinas.

## Reglas del juego

El juego sigue cuatro reglas básicas:

1. Una célula viva con menos de dos vecinas vivas muere por soledad.
2. Una célula viva con dos o tres vecinas vivas sobrevive.
3. Una célula viva con más de tres vecinas vivas muere por superpoblación.
4. Una célula muerta con exactamente tres vecinas vivas se convierte en una célula viva.

## Funcionamiento

El tablero está formado por una cuadrícula de células. En cada generación, se comprueba el estado de todas las células y se aplican las reglas del juego para calcular la siguiente generación.

El proceso se repite, mostrando cómo evolucionan las células con el paso del tiempo.

## Objetivo

El objetivo es observar los patrones que aparecen durante la simulación, ya que algunas configuraciones desaparecen, otras permanecen estables y algunas se repiten o se desplazan por el tablero.

## Tecnologías utilizadas

- HTML
- CSS
- JavaScript

## Ejecución

1. Descargar o clonar el proyecto.
2. Abrir la carpeta del proyecto.
3. Abrir el archivo `index.html` en un navegador web.
4. Iniciar la simulación si el proyecto dispone de un botón para ello.

## Autor
Pepe Gil Cué (Inicializada con Claude AI)
Proyecto realizado como actividad de Desarrollo Web Entorno Cliente.
