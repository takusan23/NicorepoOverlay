// 読み込みが終わったら
window.onload = () => {
    // オーバーレイ表示する要素を表示するdiv
    const nicorepoDiv = document.createElement('div')
    // アイコン
    const img = document.createElement('img')
    img.src = `${chrome.runtime.getURL('img/nicorepo_overlay.svg')}`
    img.width = 20
    img.height = 20
    // ニコレポボタン
    const nicorepoButton = document.createElement('p')
    nicorepoButton.append(img)
    nicorepoButton.append('ニコレポ')
    nicorepoButton.style.color = '#ffffff'
    nicorepoButton.style.padding = '8px'
    nicorepoButton.style.cursor = 'pointer'
    nicorepoDiv.append(nicorepoButton)

    // ニコレポオーバーレイ。本家の「お知らせ」をパクる
    // 複雑過ぎてわからんから innerHTML 使うわ。しばらくしたら４にそう
    const nicorepoOverlay = document.createElement('div')
    nicorepoOverlay.innerHTML = `
    <div class="common-header-6hj71y" style="background:#fff;margin:0px" id="nicorepo_overlay">
        <div class="common-header-105n2rz">
            <div class="common-header-1l1lwin">
                <div class="common-header-abyv5k" style="margin:0px">ニコレポ</div>
            </div>
            <div class="common-header-wgjwwi" style="padding:10px;height:600px">
                <div class="common-header-i4xr99">
                    <div>

                        <!-- Vue.js はじまり -->
                        <div id="app" >
                            <!-- v-for で繰り返す -->
                            <div v-for="item in nicorepo">
                                <div class="common-header-kolmxm">
                                    <!-- 押したら移動するための aタグ -->
                                    <a class="common-header-d2321f"
                                        href="{{item.url}}"
                                        style="width:300px"
                                        target="_blank">
                                        <div class="common-header-1hpqfmt">
                                            <!-- アバター画像 -->
                                            <img class="common-header-uqv5mu"
                                                v-bind:src="item.icon"
                                                alt="{{item.title}}">
                                        </div>
                                        <div class="common-header-vv8zyj" style="margin:0px;margin-left: 50px;">{{item.supplier}}さんが{{item.title}}</div>
                                        <div class="common-header-2cl2ey" style="margin:0px;margin-left: 50px;">
                                            <div class="common-header-ey0i79">{{item.description}}</div>
                                        </div>
                                        <div class="common-header-9l26sq">{{item.time}}</div>
                                    </a>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            <a class="common-header-1ip78db" href="https://www.nicovideo.jp/my/top">
                <div class="common-header-9wgpqv">
                    <div class="common-header-1eex7vk">ニコレポ一覧へ</div>
                </div>
            </a>
        </div>
    </div>
    `
    // 追加
    nicorepoDiv.append(nicorepoOverlay)
    // 初めは非表示へ
    nicorepoOverlay.style.display = 'none'

    // ニコレポボタンへマウスオーバーしたら表示
    nicorepoButton.addEventListener('mouseover', () => {
        // 空ならAPIを叩く。なんでこんな設計なんだって話だけど一回も表示しないのにAPIだけ叩くのもなんかなあって感じで
        if (app.nicorepo.length === 0) {
            app.getNicorepo()
        }
        nicorepoOverlay.style.display = 'inline'
    })
    // 離れたら消す
    nicorepoButton.addEventListener('mouseout', () => {
        nicorepoOverlay.style.display = 'none'
    })

    // mouseover / mouseout が子要素にカーソルが移るとうまく行かないので mouseenter / mouseleave を使う。
    // ニコレポ一覧画面で一覧離れたら消す処理
    nicorepoOverlay.addEventListener('mouseenter', () => {
        nicorepoOverlay.style.display = 'inline'
    })
    nicorepoOverlay.addEventListener('mouseleave', () => {
        nicorepoOverlay.style.display = 'none'
    })

    // ボタン追加
    document.getElementsByClassName('common-header-1yyyj6n')[0].insertBefore(nicorepoDiv, document.getElementsByClassName('common-header-nyvm7j')[0])


    // 今回はVue.jsの力を借りる
    var app = new Vue({
        el: '#app',
        data: {
            nicorepo: []
        },
        methods: {
            // ニコレポAPIを叩く
            getNicorepo: function () {
                fetch('https://www.nicovideo.jp/api/nicorepo/timeline/my/all?client_app=pc_myrepo', {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'NicorepoOverlay;takusan23'
                    }
                }).then(response => {
                    // 成功時
                    if (response.ok) {
                        response.json().then(json => {
                            // JSON解析
                            for (let i = 0; i < json.data.length; i++) {
                                const data = json.data[i]
                                // 動画なのか
                                const isVideo = data.topic === 'nicovideo.user.video.upload'
                                // それとも生放送なのか
                                const isLive = data.topic === 'live.user.program.onairs'
                                // いやチャンネル放送かもしれんわ
                                const isLiveChannel = data.topic === 'live.channel.program.onairs'
                                // いや予約枠じゃない？
                                const isLiveReserve = data.topic === 'live.user.program.reserve'
                                // 動画と生放送以外（チャンネル・予約枠は表示）は動かないように
                                if (isLive || isVideo || isLiveChannel || isLiveReserve) {
                                    // 投稿 or 枠開始
                                    let title = ''
                                    // タイトル
                                    let description = ''
                                    // うらる
                                    let url = ''
                                    // アイコン
                                    let icon = ''
                                    // 時間
                                    let time = ''
                                    // 投稿者
                                    let supplier = ''
                                    // 予約枠かどうか
                                    let isReserveProgram = isLiveReserve
                                    if (isVideo) {
                                        title = '動画を投稿しました。'
                                        description = data.video.title
                                        url = `https://nico.ms/${data.video.videoWatchPageId}`
                                        icon = data.video.thumbnailUrl.normal
                                        time = new Date(data.createdAt).toLocaleString()
                                        supplier = data.senderNiconicoUser.nickname
                                    } else {
                                        if (isReserveProgram) {
                                            // 予約枠
                                            const openTime = new Date(data.program.beginAt).toLocaleString()
                                            title = `${openTime}開始の予約枠を作成しました。`
                                        } else {
                                            title = '生放送を開始しました。'
                                        }
                                        description = data.program.title
                                        url = `https://nico.ms/${data.program.id}`
                                        icon = data.program.thumbnailUrl
                                        time = new Date(data.createdAt).toLocaleString()
                                        if (isLiveChannel) {
                                            // チャンネル番組はJSONがちょっと違う
                                            supplier = data.senderChannel.name
                                        } else {
                                            supplier = data.senderNiconicoUser.nickname
                                        }
                                    }
                                    // オブジェクトへ
                                    const nicorepoData = {
                                        title: title,
                                        description: description,
                                        url: url,
                                        icon: icon,
                                        time: time,
                                        supplier: supplier,
                                        isReserveProgram: isReserveProgram
                                    }
                                    this.nicorepo.push(nicorepoData)
                                }
                            }
                        })
                    }
                })
            }
        }
    })

}