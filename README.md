# Deltarune Rock Band

## Summary

This is a replica of the Rock Band minigame in Deltarune Chapter 3. You play as Kris in a Guitar-Hero-esque game. It is
implemented in TypeScript, using the canvas to display.

## How to Play

After the opening, keys shall start descending down the left and the right tracks. Press them in time with Z or Left
Arrow, and X or Right Arrow.

Some notes are longer with a tail. For these notes, hold down the buttton for the duration of the tail to score extra
points.

## Deployment

This is a static site using TypeScript. In order to deploy, compile the site with `npm run build`. Then, upload the
`favicon.ico`, `index.html`, `styles.css`, `assets` directory, and the `dist` directory to any static site host online,
or use GitHub Pages.
