/**
 * TextAlive App API lyric sheet example
 * https://github.com/TextAliveJp/textalive-app-lyric-sheet
 *
 * インタラクティブな歌詞カードを実装した TextAlive App API のサンプルコードです。
 * 発声にあわせて歌詞が表示され、歌詞をクリックするとそのタイミングに再生がシークします。
 * また、このアプリが TextAlive ホストと接続されていなければ再生コントロールを表示します。
 */
const { Player } = TextAliveApp;

// TextAlive Player を初期化
const player = new Player({
  // トークンは https://developer.textalive.jp/profile で取得したものを使う
  app: {
    token: "JY0mLoHiX3lPTJaS",
    parameters: [
      {
        title: "Gradation start color",
        name: "gradationStartColor",
        className: "Color",
        initialValue: "#eed475",
      },
      {
        title: "Gradation middle color",
        name: "gradationMiddleColor",
        classname: "Color",
        initialValue: "#60a8a9"
      },
      {
        title: "Gradation end color",
        name: "gradationEndColor",
        className: "Color",
        initialValue: "#d7809e",
      },
    ],
  },

  mediaElement: document.querySelector("#media"),
  mediaBannerPosition: "bottom right",

  // オプション一覧
  // https://developer.textalive.jp/packages/textalive-app-api/interfaces/playeroptions.html
});

const overlay = document.querySelector("#overlay");
const bar = document.querySelector("#bar");
const textContainer = document.querySelector("#text");
const seekbar = document.querySelector("#seekbar");
const paintedSeekbar = seekbar.querySelector("div");
let b, c;

player.addListener({
  /* APIの準備ができたら呼ばれる */
  onAppReady(app) {
    if (app.managed) {
      document.querySelector("#control").className = "disabled";
    }
    if (!app.songUrl) {
      document.querySelector("#media").className = "disabled";

      player.createFromSongUrl("https://piapro.jp/t/hZ35/20240130103028", {
        video: {
          // 音楽地図訂正履歴
          beatId: 4592293,
          chordId: 2727635,
          repetitiveSegmentId: 2824326,
          // 歌詞タイミング訂正履歴: https://textalive.jp/lyrics/piapro.jp%2Ft%2FhZ35%2F20240130103028
          lyricId: 59415,
          lyricDiffId: 13962,
        },
      });
    }
  },

  /* パラメタが更新されたら呼ばれる */
  onAppParameterUpdate: () => {
    const params = player.app.options.parameters;
    const sc = player.app.parameters.gradationStartColor,
      scString = sc ? `rgb(${sc.r}, ${sc.g}, ${sc.b})` : params[0].initialValue;
    const mc = player.app.parameters.gradationMiddleColor,
      mcString = mc ? `rgb(${mc.r}, ${mc.g}, ${mc.b})` : params[0].initialValue;
    const ec = player.app.parameters.gradationEndColor,
      ecString = ec ? `rgb(${ec.r}, ${ec.g}, ${ec.b})` : params[1].initialValue;
    document.body.style.backgroundColor = ecString;
    document.body.style.backgroundImage = `linear-gradient(0deg, ${ecString} 0%, ${mcString} 50%, ${scString} 100%)`;
  },

  /* 楽曲が変わったら呼ばれる */
  onAppMediaChange() {
    // 画面表示をリセット
    overlay.className = "";
    bar.className = "";
    resetChars();
  },

  /* 楽曲情報が取れたら呼ばれる */
  onVideoReady(video) {
    // 楽曲情報を表示
    document.querySelector("#artist span").textContent =
      player.data.song.artist.name;
    document.querySelector("#song span").textContent = player.data.song.name;

    // 最後に表示した文字の情報をリセット
    c = null;
  },

  /* 再生コントロールができるようになったら呼ばれる */
  onTimerReady() {
    overlay.className = "disabled";
    document.querySelector("#control > a#play").className = "";
    document.querySelector("#control > a#stop").className = "";
  },

  /* 再生位置の情報が更新されたら呼ばれる */
  onTimeUpdate(position) {
    // シークバーの表示を更新
    paintedSeekbar.style.width = `${
      parseInt((position * 1000) / player.video.duration) / 10
    }%`;

    // 現在のビート情報を取得
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

    // 歌詞情報がなければこれで処理を終わる
    if (!player.video.firstChar) {
      return;
    }

    // 巻き戻っていたら歌詞表示をリセットする
    if (c && c.startTime > position + 1000) {
      resetChars();
    }

    // 500ms先に発声される文字を取得
    let current = c || player.video.firstChar;
    while (current && current.startTime < position + 500) {
      // 新しい文字が発声されようとしている
      if (c !== current) {
        newChar(current);
        c = current;
      }
      current = current.next;
    }
  },

  /* 楽曲の再生が始まったら呼ばれる */
  onPlay() {
    const a = document.querySelector("#control > a#play");
    while (a.firstChild) a.removeChild(a.firstChild);
    a.appendChild(document.createTextNode("\uf28b"));
  },

  /* 楽曲の再生が止まったら呼ばれる */
  onPause() {
    const a = document.querySelector("#control > a#play");
    while (a.firstChild) a.removeChild(a.firstChild);
    a.appendChild(document.createTextNode("\uf144"));
  },
});

/* 再生・一時停止ボタン */
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

/* 停止ボタン */
document.querySelector("#control > a#stop").addEventListener("click", (e) => {
  e.preventDefault();
  if (player) {
    player.requestStop();

    // 再生を停止したら画面表示をリセットする
    bar.className = "";
    resetChars();
  }
  return false;
});

/* シークバー */
seekbar.addEventListener("click", (e) => {
  e.preventDefault();
  if (player) {
    player.requestMediaSeek(
      (player.video.duration * e.offsetX) / seekbar.clientWidth
    );
  }
  return false;
});

/**
 * 新しい文字の発声時に呼ばれる
 * Called when a new character is being vocalized
 */
function newChar(current) {
  // 品詞 (part-of-speech)
  // https://developer.textalive.jp/packages/textalive-app-api/interfaces/iword.html#pos
  const classes = [];
  if (
    current.parent.pos === "N" ||
    current.parent.pos === "PN" ||
    current.parent.pos === "X"
  ) {
    classes.push("noun");
  }

  // フレーズの最後の文字か否か
  if (current.parent.parent.lastChar === current) {
    classes.push("lastChar");
  }

  // 英単語の最初か最後の文字か否か
  if (current.parent.language === "en") {
    if (current.parent.lastChar === current) {
      classes.push("lastCharInEnglishWord");
    } else if (current.parent.firstChar === current) {
      classes.push("firstCharInEnglishWord");
    }
  }

  // noun, lastChar クラスを必要に応じて追加
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(current.text));

  // 文字を画面上に追加
  const container = document.createElement("div");
  container.className = classes.join(" ");
  container.appendChild(div);
  container.addEventListener("click", () => {
    player.requestMediaSeek(current.startTime);
  });
  textContainer.appendChild(container);
}

/**
 * 歌詞表示をリセットする
 * Reset lyrics view
 */
function resetChars() {
  c = null;
  while (textContainer.firstChild)
    textContainer.removeChild(textContainer.firstChild);
}
