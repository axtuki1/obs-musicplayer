"use strict";

(function () {
    var jsmediatags = window.jsmediatags;

    window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
    const now = window.performance && (
        performance.now ||
        performance.mozNow ||
        performance.msNow ||
        performance.oNow ||
        performance.webkitNow);
    const getTime = function () {
        return (now && now.call(performance)) || (new Date().getTime());
    }
    const mainScreen = document.getElementById("mainScreen");

    const SendNotice = function (out, classs) {
        const notice = $("<div></div>").html(out).addClass("notice").addClass(classs);
        const al = $(".notice-wrapper ." + classs).remove();
        $(".notice-wrapper").append(notice);
        setTimeout(function () {
            notice.get(0).remove();
        }, 2.5 * 1000);
    }

    window.MusicPlayer = {
        option: {
            canvasScale: 1.25,
            FPSShow: true,
            audioVisualizer: {
                enable: true,
                type: "under",
                minFreq: 0,
                maxFreq: 10000
            },
            backgroundGradient: {
                enable: true,
                colorFrom: {
                    h: [280, 20], // Range of hue
                    s: 75,
                    l: 40
                },
                colorTo: {
                    h: [120, 350],
                    s: 80,
                    l: 30
                },
                duration: 8000
            }
        },
        PlayingData: {
            id3Data: {},
            title: "",
            artist: "すやすや...",
            album: "",
            artworkUrl: null,
            artwork: null
        },
        Time: {
            deltaTime: 0,
            lastTime: -1,
            deltaTimeRaw: 0,
        },
        audio: {
            analyser: null,
            fftSize: 512,
            equalizer: {
                frequency: [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000],
                currentFrequency: {}
            },
        },
        bg: {
            elapsedTime: 0,
            previousTime: 0
        },
        volume: 0.175,
        playlist: {
            enable: false,
            repeat: true,
            shuffle: false,
            currentIndex: 0,
            musicList: [
                {
                    path: "",
                }
            ],
            originMusiclist: [
                {
                    path: "",
                }
            ],
            Play: () => {
                window.MusicPlayer.playlist.enable = true;
                window.MusicPlayer.playlist.originMusiclist = window.MusicPlayer.playlist.musicList;
                if (window.MusicPlayer.playlist.shuffle) {
                    window.MusicPlayer.playlist.musicList = arrayShuffle(window.MusicPlayer.playlist.originMusiclist);
                }
                loadMedia(window.MusicPlayer.playlist.musicList[window.MusicPlayer.playlist.currentIndex].path);
            }
        }
    };

    window.MusicPlayer.PlayingData.artwork = document.getElementsByClassName("artwork")[0];

    const arrayShuffle = (arr) => {
        var newArr = [], oldArr = [];

        for (var i = 0, len = arr.length; i < len; i++) oldArr.push(arr[i]);

        while (oldArr.length) {
            newArr.push(oldArr.splice(Math.floor(Math.random() * (oldArr.length - 1 + 1 - 0) + 0), 1)[0]);
        }

        return newArr;
    };

    let audio;
    let video = document.createElement("video");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.volume = window.MusicPlayer.volume;
    video.addEventListener("timeupdate", () => {
        window.MusicPlayer.isLoading = false;
        video.volume = window.MusicPlayer.volume;
    });
    video.addEventListener("play", () => {
        window.MusicPlayer.isLoading = false;
        video.volume = window.MusicPlayer.volume;
    });
    video.addEventListener("playing", () => {
        window.MusicPlayer.isLoading = false;
        video.volume = window.MusicPlayer.volume;
    });
    video.addEventListener("loadstart", () => {
        window.MusicPlayer.isLoading = true;
    });
    video.addEventListener("ended", () => {
        if (window.MusicPlayer.playlist.enable) {
            const musicCount = window.MusicPlayer.playlist.musicList.length;
            window.MusicPlayer.playlist.currentIndex++;
            if (window.MusicPlayer.playlist.currentIndex >= musicCount) {
                window.MusicPlayer.playlist.currentIndex = 0;
                if (window.MusicPlayer.playlist.repeat) {
                    loadMedia(window.MusicPlayer.playlist.musicList[window.MusicPlayer.playlist.currentIndex].path);
                }
            } else {
                loadMedia(window.MusicPlayer.playlist.musicList[window.MusicPlayer.playlist.currentIndex].path);
            }
        }
    });

    const visualizer_drawType = {
        normal: {
            name: "標準",
            func: (context, i, copy) => {
                const cw = mainScreen.width,
                    ch = mainScreen.height,
                    value = copy[i],
                    percent = value / 255,
                    height = ch * percent,
                    offset = ch - height,
                    barWidth = cw / copy.length;

                let rectangle_color = context.createLinearGradient(0, 0, 0, mainScreen.height / 2);
                rectangle_color.addColorStop(0.0, 'rgba(200, 200, 200, 255)');
                rectangle_color.addColorStop(0.8, 'rgba(112, 112, 112, 255)');
                rectangle_color.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
                context.fillStyle = rectangle_color;
                context.fillRect(i * barWidth, offset / 2, barWidth / 2, height / 2);

                rectangle_color = context.createLinearGradient(0, mainScreen.height / 2, 0, mainScreen.height);
                rectangle_color.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
                rectangle_color.addColorStop(0.2, 'rgba(112, 112, 112, 255)');
                rectangle_color.addColorStop(1.0, 'rgba(200, 200, 200, 255)');
                context.fillStyle = rectangle_color;
                context.fillRect(i * barWidth, ch / 2, barWidth / 2, height / 2);
            }
        },
        under: {
            name: "下付き",
            func: (context, i, copy) => {
                const cw = mainScreen.width,
                    ch = mainScreen.height,
                    value = copy[i],
                    percent = value / 255,
                    scale = 0.7,
                    height = ch * percent * scale,
                    offset = ch - height,
                    barWidth = cw / copy.length;

                context.fillStyle = 'rgba(200, 200, 200, 255)';
                context.fillRect(i * barWidth, offset, barWidth / 2, height);
            }
        },
        raw: {
            name: "RAW",
            preFunc: (context, copy) => {
                // context.rotate(270 * Math.PI / 180);
            },
            func: (context, i, copy) => {
                const cw = mainScreen.width,
                    ch = mainScreen.height,
                    value = copy[i],
                    percent = value / 255,
                    height = ch * percent,
                    offset = ch - height,
                    barWidth = cw / copy.length,
                    currentFrequency = i * 44100 / window.MusicPlayer.audio.fftSize;
                // context.rotate(90 * Math.PI / 180);
                context.fillStyle = 'rgba(200, 200, 200, 255)';
                context.font = "1.2em 'Helvetica Neue', Helvetica, Arial, sans-serif";
                let y = i * 20;
                let x = 0;
                while (y > ch) {
                    y = y - ch;
                    x = x + 425
                }
                context.fillText(
                    currentFrequency + "Hz: " + value + " [" + percent * 100 + "%]",
                    x,
                    y
                );
            }
        }
    }

    $(".retry-play-wrapper").hide();
    const loadMedia = (file) => {
        if (typeof file === "string") {
            file = file.replace(/\${BASEPATH}/g, location.origin);
        }
        connectAudio();
        loadAudioData(file);
        let url = file;
        if (file instanceof File) {
            url = URL.createObjectURL(file);
        }
        video.src = url;
        video.play().catch((e) => {
            $(".retry-play-wrapper").on({
                "click": (event) => {
                    audio.resume();
                    loadMedia(file);
                    $(".retry-play-wrapper").hide();
                }
            });
            $(".retry-play-wrapper").show();
        });
    }

    window.addEventListener("dragover", (e) => {
        e.preventDefault();
    });

    window.addEventListener("drop", (event) => {
        event.preventDefault();
        if (event.dataTransfer == null) {
            event = event.originalEvent;
        }
        const file = event.dataTransfer.files[0];
        window.MusicPlayer.error = "";
        if (file.type.indexOf('video/') === 0 || file.type.indexOf('audio/') === 0) {
            loadMedia(file);
            SendNotice("Dropped File: " + file.name, "drop");
        } else {
            SendNotice("ドロップされたファイルはプレビューできません。", "drop");
        }
    });

    const drawUpdate = () => {
        const currentTime = getTime();
        if (window.MusicPlayer.Time.lastTime > 0) {
            window.MusicPlayer.Time.deltaTimeRaw = currentTime - window.MusicPlayer.Time.lastTime;
            window.MusicPlayer.Time.deltaTime = window.MusicPlayer.Time.deltaTimeRaw / 1000;
        }
        window.MusicPlayer.Time.lastTime = currentTime;
        Update();

        requestAnimationFrame(drawUpdate);
    }
    requestAnimationFrame(drawUpdate);

    const equalizerUpdate = () => {
        const list = window.MusicPlayer.audio.equalizer.currentFrequency;
        for (let frequency in list) {
            const node = list[frequency].node;
            node.gain.setValueAtTime(list[frequency].value, node.context.currentTime + 0.5);
        }
    }
    window.MusicPlayer.audio.equalizerUpdate = equalizerUpdate;

    const connectAudio = () => {
        if (audio == null) {
            audio = new AudioContext();
            let audioS = audio.createMediaElementSource(video),
                analyser = audio.createAnalyser(),
                masterGain = audio.createGain(),
                frequency = null,
                before = audioS;
            const frequencyList = window.MusicPlayer.audio.equalizer.frequency;
            for (let key in frequencyList) {
                frequency = audio.createBiquadFilter();
                frequency.type = "peaking";
                frequency.frequency.value = frequencyList[key];
                window.MusicPlayer.audio.equalizer.currentFrequency[frequencyList[key]] = {
                    node: frequency,
                    value: 0
                }
                // $(".equalizer-wrapper .equalizer .control").append(
                // 	$("<div></div>").addClass(frequencyList[key] + "Hz").addClass("slider").html(
                // 		$("<input>").prop("type", "range")
                // 			.prop("min", "-12")
                // 			.prop("max", "12")
                // 			.prop("value", "0")
                // 			.prop("orient", "vertical")
                // 	).attr({ "frequency": frequencyList[key] })
                // );
                before.connect(frequency);
                before = frequency;
            }
            frequency.connect(analyser);
            analyser.connect(masterGain);
            masterGain.connect(audio.destination);
            window.MusicPlayer.audio.audioContext = audio;
            window.MusicPlayer.audio.analyser = analyser;
            window.MusicPlayer.audio.masterGain = masterGain;
            equalizerUpdate();
            $(".equalizer .slider input").on({
                "input": () => {
                    equalizerUpdate();
                },
                "mousemove": () => {
                    equalizerUpdate();
                },
                "mouseup": () => {
                    equalizerUpdate();
                }
            });
        }
    }

    /**
     * 
     */
    const Update = () => {
        mainScreen.width = mainScreen.getBoundingClientRect().width * (window.MusicPlayer.option.canvasScale <= 0 ? 1.25 : window.MusicPlayer.option.canvasScale);
        mainScreen.height = mainScreen.getBoundingClientRect().height * (window.MusicPlayer.option.canvasScale <= 0 ? 1.25 : window.MusicPlayer.option.canvasScale);
        const context = mainScreen.getContext("2d");

        let canvasAspect = mainScreen.width / mainScreen.height, // canvasのアスペクト比
            left, top, width, height;
        context.fillStyle = "black";
        context.fillRect(0, 0, mainScreen.width, mainScreen.height);

        context.resetTransform();
        drawBackground(context);
        context.resetTransform();
        drawAudioVisualizer(context);
        context.resetTransform();
        drawMusicInfomation(context);
        context.resetTransform();
        drawFPS(context);
    }

    const toCssColor = (color, progress) => {
        const { h, s, l } = color;
        const hue = Math.floor(h[0] + (h[1] - h[0]) * progress);

        return `hsl(${hue}, ${s}%, ${l}%)`
    }

    const drawBackground = (context) => {
        if (!window.MusicPlayer.option.backgroundGradient.enable) return;
        const nowTime = getTime();
        const delta = window.MusicPlayer.Time.deltaTimeRaw;

        window.MusicPlayer.bg.elapsedTime += delta;
        window.MusicPlayer.bg.previousTime = nowTime;

        // progress: 0 -> 1 -> 0 -> 1 ...
        const rawProgress = (window.MusicPlayer.bg.elapsedTime % window.MusicPlayer.option.backgroundGradient.duration) / window.MusicPlayer.option.backgroundGradient.duration;
        const isForward = Math.floor(window.MusicPlayer.bg.elapsedTime / window.MusicPlayer.option.backgroundGradient.duration) % 2 === 0
        const progress = isForward ? rawProgress : 1 - rawProgress

        // Top right to bottom left
        const gradient = context.createLinearGradient(mainScreen.width, 0, 0, mainScreen.height)

        gradient.addColorStop(0, toCssColor(window.MusicPlayer.option.backgroundGradient.colorFrom, progress))
        gradient.addColorStop(1, toCssColor(window.MusicPlayer.option.backgroundGradient.colorTo, progress))

        context.fillStyle = gradient;
        context.fillRect(0, 0, mainScreen.width, mainScreen.height);

    }
    const drawAudioVisualizer = (context) => {
        let analyser = window.MusicPlayer.audio.analyser;
        if (analyser == null) return;
        analyser.fftSize = window.MusicPlayer.audio.fftSize;
        const bufferLength = analyser.frequencyBinCount, frequency = new Uint8Array(bufferLength), fftSize = window.MusicPlayer.audio.fftSize;
        analyser.getByteFrequencyData(frequency);
        const copy = [];
        for (let i = 0, len = frequency.length; i < len; i++) {
            const currentFrequency = i * 44100 / fftSize;
            if (currentFrequency < window.MusicPlayer.option.audioVisualizer.minFreq) continue;
            if (window.MusicPlayer.option.audioVisualizer.maxFreq < currentFrequency) break;
            copy.push(frequency[i]);
        }
        let type = visualizer_drawType[window.MusicPlayer.option.audioVisualizer.type];
        if (!(type != null && typeof (type.func) == "function")) {
            type = visualizer_drawType.normal;
        }
        if (type.preFunc != null && typeof (type.preFunc) == "function") {
            type.preFunc(context, copy);
        }
        for (let i = 0; i < copy.length; i++) {
            type.func(context, i, copy);
        }
    }

    const loadAudioData = (file) => {
        jsmediatags.read(file, {
            onSuccess: function (tag) {
                window.MusicPlayer.PlayingData.id3Data = tag.tags;
                window.MusicPlayer.PlayingData.title = tag.tags.title;
                window.MusicPlayer.PlayingData.artist = tag.tags.artist;
                window.MusicPlayer.PlayingData.album = tag.tags.album;
                window.MusicPlayer.PlayingData.artworkUrl = null;
                try {
                    const { data, format } = tag.tags.picture;
                    console.log(tag.tags.picture);
                    let base64String = "";
                    for (let i = 0; i < data.length; i++) {
                        base64String += String.fromCharCode(data[i]);
                    }
                    window.MusicPlayer.PlayingData.artworkUrl = `data:${format};base64,${window.btoa(base64String)}`;
                } catch (e) {
                }
            },
            onError: function (error) {
                SendNotice("楽曲データの読み出しに失敗しました。", "Error");
            }
        });
    }

    /**
     * 楽曲情報の描画
     * @param {CanvasRenderingContext2D} context 
     */
    const drawMusicInfomation = (context) => {
        if (window.MusicPlayer.PlayingData.artworkUrl != null) {
            $(".music-info-wrapper .artwork").get(0).src = window.MusicPlayer.PlayingData.artworkUrl;
        } else {
            $(".music-info-wrapper .artwork").get(0).src = "./DefaultArtwork.jpg";
        }
        $(".music-info-wrapper .album").text(window.MusicPlayer.PlayingData.album);
        $(".music-info-wrapper .title").text(window.MusicPlayer.PlayingData.title);
        $(".music-info-wrapper .artist").text(window.MusicPlayer.PlayingData.artist);

        const isPlaylistMode = window.MusicPlayer.playlist.enable;
        if (isPlaylistMode && window.MusicPlayer.playlist.shuffle) {
            $(".player-settings-view-wrapper .shuffle").addClass("enable");
        } else {
            $(".player-settings-view-wrapper .shuffle").removeClass("enable");
        }
        if (isPlaylistMode && window.MusicPlayer.playlist.repeat) {
            $(".player-settings-view-wrapper .repeat").addClass("enable");
        } else {
            $(".player-settings-view-wrapper .repeat").removeClass("enable");
        }
    }

    const drawFPS = (context) => {
        const fps = Math.floor(1 / window.MusicPlayer.Time.deltaTime);
        if (window.MusicPlayer.option.FPSShow) {
            context.font = "32px 'Segment7Standard'";
            context.textAlign = "left";
            context.textBaseline = "top";
            context.fillStyle = "black";
            context.fillRect(0, 0, context.measureText(fps).width + 4, 32);
            context.fillStyle = "yellow";
            context.fillText(fps, 2, 2);
        }
    }

    if (addConfig) {
        addConfig();
    }

})();