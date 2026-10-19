#!/bin/sh
# Render every scene and encode the published media into assets/media/ (and the site copies into docs/media/).
#   video/build.sh            render + encode everything
#   video/build.sh encode     re-encode from existing video/raw/*.mp4
set -e
cd "$(dirname "$0")"
OUT=../assets/media
mkdir -p raw "$OUT"
CLIPS="orc-tabs sidebar needs-you jobs"

if [ "$1" != "encode" ]; then
  for c in master hero $CLIPS; do node render.mjs "$c"; done
fi

# Promo: H.264, yuv420p, no audio track (silent by design), web-ready.
ffmpeg -y -loglevel error -i raw/master.mp4 -c:v libx264 -preset slow -crf 23 -tune animation \
  -pix_fmt yuv420p -movflags +faststart -an "$OUT/cmux-orc-promo.mp4"
ffmpeg -y -loglevel error -ss 2.6 -i raw/master.mp4 -frames:v 1 "$OUT/cmux-orc-promo-poster.png"

gif() {  # gif <in.mp4> <out.gif> <fps> <width>
  ffmpeg -y -loglevel error -i "$1" -vf "fps=$3,scale=$4:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" -loop 0 "$2"
}
mp4() {  # mp4 <in.mp4> <out.mp4> <width>
  ffmpeg -y -loglevel error -i "$1" -vf "scale=$3:-2:flags=lanczos" -c:v libx264 -preset slow -crf 22 -tune animation \
    -pix_fmt yuv420p -movflags +faststart -an "$2"
}
gif raw/hero.mp4 "$OUT/cmux-orc-hero.gif" 15 800
mp4 raw/hero.mp4 "$OUT/cmux-orc-hero.mp4" 1000
for c in $CLIPS; do
  gif "raw/$c.mp4" "$OUT/feature-$c.gif" 15 800
  mp4 "raw/$c.mp4" "$OUT/feature-$c.mp4" 1200
done

if [ -d ../docs ]; then
  mkdir -p ../docs/media
  cp "$OUT/cmux-orc-promo.mp4" ../docs/media/
  ffmpeg -loglevel error -y -i "$OUT/cmux-orc-promo-poster.png" -q:v 4 ../docs/media/cmux-orc-promo-poster.jpg
  for c in $CLIPS; do cp "$OUT/feature-$c.mp4" ../docs/media/; done
fi
ls -l "$OUT"
