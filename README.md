# Simple Music Player

OBSのブラウザを用いて表示することを想定した音楽プレイヤーです。  
VRChatなどのVRプラットフォームにTopazChat経由で音楽を流したい時に便利かもです。

配信の際には使用する楽曲の著作権など各種権利関係にご注意ください。

## GETパラメータ
### playlist
同じ階層に配置したJSONファイルを読み出し、その内容で再生を開始します。  

`https://example.com/obs-musicplayer?playlist=MusicSet1`の場合、  
`https://example.com/obs-musicplayer/MusicSet1.json`の内容で再生します。

JSONの指定方法は以下の通りです。  
`${BASEPATH}`は`location.origin`、つまり例でいうところの`https://example.com`に置き換えられます。
```json
[
    {
        "path": "${BASEPATH}/obs-musicplayer/music/Music1.mp3"
    },
    {

        "path": "${BASEPATH}/obs-musicplayer/music/Music2.mp3"
    }
]
```
<!-- 何かをしたかったらしいんだけど結局URL指定しかしてない -->

## vol
そのまま音量です。0 - 100の間で指定します。

## ライセンス
MITライセンスにしてます。一応。