const { Player } = TextAliveApp;
const player = new Player({
  app: { token: "JY0mLoHiX3lPTJaS", parameters: [
    {title: "背景グラデーション開始色", name: "gradationStartColor", className: "Color", iniitalValue: "#63d0e2" },
    {title: "背景グラデーション終了色", name: "gradationEndColor", className: "Color", iniitalValue: "#ff9438" },
  ] },
  mediaElement: document.querySelector("#media"),
  mediaBannerPosition: "bottom right",
});
const overlay = document.querySelector("#overlay");
const bar = document.querySelector("#bar");
const textContainer = document.querySelector("#text");
const seekbar = document.querySelector("#seekbar");
const paintedSeekbar = seekbar.querySelector("div");
let b, c;
player.addListener({
  onAppReady(app) {
    if (app.managed) {
      document.querySelector("#control").className = "disabled";
    }
    if (!app.songUrl) {
      document.querySelector("#media").className = "disabled";
      player.createFromSongUrl("https://piapro.jp/t/FDb1/20210213190029", {
        video: {
          beatId: 3953882,
          repetitiveSegmentId: 2099561,
          lyricId: 52065,
          lyricDiffId: 5093,
        },
      });
    }
  },
  onAppParameterUpdate: () => {
    const params = player.app.options.parameters;
    const sc = player.app.parameters.gradationStartColor, scString = sc ? `rgb(${sc.r}, ${sc.g}, ${sc.b})` : params[0].iniitalValue;
    const ec = player.app.parameters.gradationEndColor, ecString = ec ? `rgb(${ec.r}, ${ec.g}, ${sc.b})` : params[1].iniitalValue;
    document.body.style.backgroundColor = ecString;
    document.body.style.backgroundImage = `linear-gradient(0deg, ${ecString} 0%, ${scString} 100%)`;
  },
  onAppMediaChange() {
    overlay.className = "";
    bar.className = "";
    resetChars();
  },
  onVideoReady(video) {
    document.querySelector("#artist span").textContent =
      player.data.song.artist.name;
    document.querySelector("#song span").textContent = player.data.song.name;
    c = null;
  },
  onTimerReady() {
    overlay.className = "disabled";
    document.querySelector("#control > a#play").className = "";
    document.querySelector("#control > a#stop").className = "";
  },
  onTimeUpdate(position) {
    paintedSeekbar.style.width = `${
      parseInt((position * 1000) / player.video.duration) / 10
    }%`;
    let beat = player.findBeat(position);
    if (b !== beat) {
      if (beat) {
        requestAnimationFrame(() => {
          bar.className = "active";
          requestAnimationFrame(() => {
            bar.className = "active beat";
          });
        });
      }
      b = beat;
    }
    if (!player.video.firstChar) {
      return;
    }
    if (c && c.startTime > position + 1000) {
      resetChars();
    }
    let current = c || player.video.firstChar;
    while (current && current.startTime < position + 500) {
      if (c !== current) {
        newChar(current);
        c = current;
      }
      current = current.next;
    }
  },
  onPlay() {
    const a = document.querySelector("#control > a#play");
    while (a.firstChild) a.removeChild(a.firstChild);
    a.appendChild(document.createTextNode("\uf28b"));
  },
  onPause() {
    const a = document.querySelector("#control > a#play");
    while (a.firstChild) a.removeChild(a.firstChild);
    a.appendChild(document.createTextNode("\uf144"));
  },
});
document.querySelector("#control > a#play").addEventListener("click", (e) => {
  e.preventDefault();
  if (player) {
    if (player.isPlaying) {
      player.requestPause();
    } else {
      player.requestPlay();
    }
  }
  return false;
});
document.querySelector("#control > a#stop").addEventListener("click", (e) => {
  e.preventDefault();
  if (player) {
    player.requestStop();
    bar.className = "";
    resetChars();
  }
  return false;
});
seekbar.addEventListener("click", (e) => {
  e.preventDefault();
  if (player) {
    player.requestMediaSeek(
      (player.video.duration * e.offsetX) / seekbar.clientWidth
    );
  }
  return false;
});
function newChar(current) {
  const classes = [];
  if (
    current.parent.pos === "N" ||
    current.parent.pos === "PN" ||
    current.parent.pos === "X"
  ) {
    classes.push("noun");
  }
  if (current.parent.parent.lastChar === current) {
    classes.push("lastChar");
  }
  if (current.parent.language === "en") {
    if (current.parent.lastChar === current) {
      classes.push("lastCharInEnglishWord");
    } else if (current.parent.firstChar === current) {
      classes.push("firstCharInEnglishWord");
    }
  }
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(current.text));
  const container = document.createElement("div");
  container.className = classes.join(" ");
  container.appendChild(div);
  container.addEventListener("click", () => {
    player.requestMediaSeek(current.startTime);
  });
  textContainer.appendChild(container);
}
function resetChars() {
  c = null;
  while (textContainer.firstChild)
    textContainer.removeChild(textContainer.firstChild);
}
