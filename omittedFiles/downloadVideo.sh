youtube-dl https://www.youtube.com/watch?v=$1 -o 'clips/%(title)s.mp3' -x --audio-format 'mp3' || echo 'Failure' >> log.txt
# read line
# youtube-dl https://www.youtube.com/watch?v=9HJav_MU36w -o clips/'Vana kere'.mp3 -x || echo 'Failure' >> log.txt