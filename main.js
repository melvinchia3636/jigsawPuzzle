import "./style.css";

import puzzleImage from "./puzzlePacks/evening/layout.png";
import puzzleLayout from "./puzzlePacks/evening/layout.json";
import adjacents from "./puzzlePacks/evening/adjacent.json";
import masks from "./puzzlePacks/evening/masks.json";
import maskToPiecesID from "./puzzlePacks/evening/piece_id_to_mask.json";

const PUZZLE_NAME = "evening";

const game = {
  puzzle: [],
  connectedPieces: [],
  maxHeight: Math.max(...Object.values(puzzleLayout).map((piece) => piece[3])),
  init() {
    if (localStorage.getItem("puzzle")) {
      const savedPuzzle = JSON.parse(localStorage.getItem("puzzle"));
      this.connectedPieces = JSON.parse(
        localStorage.getItem("connectedPieces")
      );

      for (let pcs of Object.entries(puzzleLayout)) {
        const [key, value] = pcs;
        const [x, y, w, h] = value;

        const piece = document.createElement("div");
        piece.id = key;

        const properties = {
          backgroundImage: `url(${puzzleImage})`,
          backgroundPosition: `-${x}px -${y}px`,
          width: `${w}px`,
          height: `${h}px`,
          left: `${savedPuzzle[key].x}px`,
          top: `${savedPuzzle[key].y}px`,
          position: "absolute",
          filter: `drop-shadow(0 0 4px rgba(100, 100, 100, 1)`,
        };

        Object.assign(piece.style, properties);
        this.createBoundingBox(piece);
        document
          .getElementById(
            savedPuzzle[key].inCanvas ? "canvas" : "pieceSelector"
          )
          .appendChild(piece);
        this.puzzle.push(piece);
      }
    } else {
      this.newBoard();
    }

    for (let piece of this.puzzle) {
      piece.addEventListener("mousedown", (e) => {
        const mouseMove = (e) => {
          // check if piece is in canvas
          if (piece.parentNode.id === "canvas") {
            piece.style.left = `${
              e.clientX -
              document.getElementById("canvas").offsetLeft -
              piece.offsetWidth / 2 +
              document.getElementById("canvas").scrollLeft
            }px`;
            piece.style.top = `${
              e.clientY -
              document.getElementById("canvas").offsetTop -
              piece.offsetHeight / 2 +
              document.getElementById("canvas").scrollTop
            }px`;
          } else {
            piece.style.left = `${e.clientX - piece.offsetWidth / 2}px`;
            piece.style.top = `${e.clientY - piece.offsetHeight / 2}px`;
          }

          for (let connectedPiecesGroup of this.connectedPieces) {
            if (connectedPiecesGroup.includes(piece.id)) {
              this.connectTogether(connectedPiecesGroup, piece);
            }
          }
        };

        //drop
        const mouseUp = (e) => {
          document.removeEventListener("mousemove", mouseMove);
          document.removeEventListener("mouseup", mouseUp);

          if (piece.parentNode?.id === "pieceSelector") {
            if (
              this.isBoundingBoxCollapsed(
                piece,
                document.getElementById("canvas")
              )
            ) {
              document.getElementById("pieceSelector").removeChild(piece);
              document.getElementById("canvas").appendChild(piece);
              piece.style.left = `${
                piece.offsetLeft -
                document.getElementById("pieceSelector").offsetWidth +
                document.getElementById("canvas").scrollLeft
              }px`;
              piece.style.top = `${
                piece.offsetTop + document.getElementById("canvas").scrollTop
              }px`;

              document
                .getElementById("pieceSelector")
                .childNodes.forEach((piece, key) => {
                  piece.style.top = `${key * (this.maxHeight + 20)}px`;
                });
            }
            this.checkCollision(
              this.connectedPieces.find((group) =>
                group.includes(piece.id)
              ) || [piece.id]
            );
          } else if (piece.parentNode?.id === "canvas") {
            if (
              this.isBoundingBoxCollapsed(
                piece,
                document.getElementById("pieceSelector")
              )
            ) {
              if (
                !this.connectedPieces.find((group) => group.includes(piece.id))
              ) {
                document.getElementById("canvas").removeChild(piece);
                document.getElementById("pieceSelector").appendChild(piece);
                piece.style.left = `${200 - piece.offsetWidth / 2}px`;
                piece.style.top = `${piece.id * this.maxHeight + 40}px`;
              }
            } else {
              this.checkCollision(
                this.connectedPieces.find((group) =>
                  group.includes(piece.id)
                ) || [piece.id]
              );
            }
          }

          document.getElementById("pieceSelector").style.position = "relative";
          document.getElementById("pieceSelector").scrollTop = scrollTop;

          for (let i = 0; i < this.connectedPieces.length; i++) {
            for (let j = i + 1; j < this.connectedPieces.length; j++) {
              if (
                this.connectedPieces[i].some((piece) =>
                  this.connectedPieces[j].includes(piece)
                )
              ) {
                this.connectedPieces[i] = [
                  ...this.connectedPieces[i],
                  ...this.connectedPieces[j],
                ];
                this.connectedPieces.splice(j, 1);
                j--;
              }
            }
          }
          this.connectedPieces = this.connectedPieces.map((group) => [
            ...new Set(group),
          ]);

          this.save();
        };

        getAllDescendants(document.body).forEach((element) => {
          if (element.style) element.style.zIndex = 0;
        });

        piece.parentNode.style.zIndex = 99;
        piece.style.zIndex = 1000;

        this.connectedPieces
          .find((group) => group.includes(piece.id))
          ?.forEach((pieceID) => {
            document.getElementById(pieceID).style.zIndex = 1000;
          });

        const scrollTop = document.getElementById("pieceSelector").scrollTop;
        document.getElementById("pieceSelector").style.position = "initial";

        document.addEventListener("mousemove", mouseMove);
        document.addEventListener("mouseup", mouseUp);
      });
    }

    function getAllDescendants(node) {
      var all = [];
      getDescendants(node);

      function getDescendants(node) {
        for (var i = 0; i < node.childNodes.length; i++) {
          var child = node.childNodes[i];
          getDescendants(child);
          all.push(child);
        }
      }
      return all;
    }
  },

  createBoundingBox(piece) {
    const properties = {
      left: {
        top: 0,
        left: 0,
        width: "40px",
        height: "100%",
      },
      right: {
        top: 0,
        right: 0,
        width: "40px",
        height: "100%",
      },
      top: {
        top: 0,
        left: 0,
        width: "100%",
        height: "40px",
      },
      bottom: {
        bottom: 0,
        left: 0,
        width: "100%",
        height: "40px",
      },
    };

    for (let side in properties) {
      const boundingBox = document.createElement("div");
      boundingBox.classList.add(side);
      boundingBox.style.position = "absolute";
      Object.assign(boundingBox.style, properties[side]);
      piece.appendChild(boundingBox);
    }
  },

  connectTogether(piecesGroup, targetPiece) {
    let connected = {};

    for (let piece of piecesGroup) {
      if (adjacents[targetPiece.id].includes(piece)) {
        connect(targetPiece, document.getElementById(piece));
        this.connectTogether(
          adjacents[targetPiece.id],
          document.getElementById(piece)
        );

        connected[piece] = true;
      }
    }

    for (let piece of adjacents[targetPiece.id]) {
      if (piecesGroup.includes(piece)) {
        connectAdjacent(piecesGroup, piece, connected);
      }
    }

    function connect(piece1, piece2) {
      const [x, y] = masks[maskToPiecesID[piece1.id]];
      const [x2, y2] = masks[maskToPiecesID[piece2.id]];

      piece2.style.left = `${
        piece1.offsetLeft +
        piece1.clientWidth -
        Math.abs(x + piece1.offsetWidth - x2) +
        (piece2.parentNode.id === "pieceSelector"
          ? document.getElementById("canvas").offsetLeft
          : 0) +
        (piece1.parentNode.id === "pieceSelector"
          ? -document.getElementById("canvas").offsetLeft
          : 0)
      }px`;

      piece2.style.top = `${
        piece1.offsetTop +
        piece1.clientHeight -
        Math.abs(y + piece1.offsetHeight - y2)
      }px`;
    }

    function connectAdjacent(piecesGroup, adjacentPiece, connected) {
      for (let adj of adjacents[adjacentPiece]) {
        if (piecesGroup.includes(adj) && !connected[adj]) {
          connect(
            document.getElementById(adjacentPiece),
            document.getElementById(adj)
          );
          connected[adj] = true;

          connectAdjacent(piecesGroup, adj, connected);
        }
      }
    }
  },

  checkCollision(pieces) {
    for (let piece of pieces) {
      for (let i of this.puzzle) {
        if (i.id !== piece.id && !pieces.includes(i.id)) {
          if (
            this.isCollapsed(document.getElementById(piece), i) &&
            adjacents[i.id].includes(piece)
          ) {
            if (this.connectedPieces.find((group) => group.includes(i.id))) {
              const group = this.connectedPieces.find((group) =>
                group.includes(i.id)
              );
              this.connectedPieces = this.connectedPieces.filter(
                (g) => !g.includes(piece) && !g.includes(i.id)
              );
              this.connectedPieces.push([...group, ...pieces]);
              this.connectTogether(group, document.getElementById(piece));
            } else {
              this.connectedPieces.push([...pieces, i.id]);
              this.connectTogether(pieces, i);
            }
            return;
          }
        }
      }
    }
  },

  isCollapsed(piece1, piece2) {
    const piece1BoundingBox = {
      left: piece1.querySelector(".left"),
      right: piece1.querySelector(".right"),
      top: piece1.querySelector(".top"),
      bottom: piece1.querySelector(".bottom"),
    };

    const piece2BoundingBox = {
      left: piece2.querySelector(".left"),
      right: piece2.querySelector(".right"),
      top: piece2.querySelector(".top"),
      bottom: piece2.querySelector(".bottom"),
    };

    const [bx, by] = masks[maskToPiecesID[piece1.id]];
    const [bx2, by2] = masks[maskToPiecesID[piece2.id]];
    const [, , w, h] = puzzleLayout[piece1.id];
    const [, , w2, h2] = puzzleLayout[piece2.id];

    if (
      this.isBoundingBoxCollapsed(
        piece1BoundingBox.top,
        piece2BoundingBox.bottom
      )
    ) {
      if (Math.abs(by2 + h2 - by) < 100) {
        return true;
      }
    }

    if (
      this.isBoundingBoxCollapsed(
        piece1BoundingBox.bottom,
        piece2BoundingBox.top
      )
    ) {
      if (Math.abs(by + h - by2) < 100) {
        return true;
      }
    }

    if (
      this.isBoundingBoxCollapsed(
        piece1BoundingBox.left,
        piece2BoundingBox.right
      )
    ) {
      if (Math.abs(bx2 + w2 - bx) < 100) {
        return true;
      }
    }

    if (
      this.isBoundingBoxCollapsed(
        piece1BoundingBox.right,
        piece2BoundingBox.left
      )
    ) {
      if (Math.abs(bx + w - bx2) < 100) {
        return true;
      }
    }
  },

  isBoundingBoxCollapsed(item1, item2) {
    var object1 = item1.getBoundingClientRect();
    var object2 = item2.getBoundingClientRect();

    if (
      object1.left < object2.left + object2.width &&
      object1.left + object1.width > object2.left &&
      object1.top < object2.top + object2.height &&
      object1.top + object1.height > object2.top
    ) {
      return true;
    }

    return false;
  },

  save() {
    const pieces = Object.fromEntries(
      this.puzzle.map((piece) => [
        piece.id,
        {
          x: piece.offsetLeft,
          y: piece.offsetTop,
          inCanvas: piece.parentNode.id === "canvas",
        },
      ])
    );

    localStorage.setItem("puzzle", JSON.stringify(pieces));

    localStorage.setItem(
      "connectedPieces",
      JSON.stringify(this.connectedPieces)
    );

    localStorage.setItem("puzzleName", PUZZLE_NAME);
  },

  newBoard() {
    for (let pcs of Object.entries(puzzleLayout)) {
      const [key, value] = pcs;
      const [x, y, w, h] = value;

      const piece = document.createElement("div");
      piece.id = key;

      const properties = {
        backgroundImage: `url(${puzzleImage})`,
        backgroundPosition: `-${x}px -${y}px`,
        width: `${w}px`,
        height: `${h}px`,
        left: `${200 - w / 2}px`,
        top: `${key * (this.maxHeight + 40)}px`,
        position: "absolute",
        filter: `drop-shadow(0 0 4px rgba(100, 100, 100, 1)`,
      };

      Object.assign(piece.style, properties);
      this.createBoundingBox(piece);
      document.getElementById("pieceSelector").appendChild(piece);
      this.puzzle.push(piece);
    }
  },
};

game.init();

document.getElementById("exportSave").addEventListener("click", () => {
  // export stuff in localStorage to a file
  const data = {
    puzzle: JSON.parse(localStorage.getItem("puzzle")),
    connectedPieces: JSON.parse(localStorage.getItem("connectedPieces")),
    puzzleName: localStorage.getItem("puzzleName"),
  };

  const blob = new Blob([JSON.stringify(data)], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "puzzle.json";
  a.click();
});
