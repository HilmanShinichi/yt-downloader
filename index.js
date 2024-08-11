const fs = require('fs');
const readline = require('readline');
const ffmpegPath = 'C:\\ffmpeg\\bin\\ffmpeg.exe'; // Ganti dengan path ke ffmpeg di sistem Anda
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const ytdl = require("@distube/ytdl-core");


// const path = require('path');

// const folderPath = 'Scrap';

// // Membuat path lengkap ke file HTML
// const filePath = path.join(folderPath, 'output.html');

// // Membuat folder jika belum ada
// if (!fs.existsSync(folderPath)) {
//   fs.mkdirSync(folderPath);
// }

// const miniget = require('miniget');

// // Membuka stream untuk menulis ke file HTML
// const fileStream = fs.createWriteStream(filePath, { flags: 'w' });


// //Mengambil konten dari URL
// miniget('https://www.tunasmitra.co.id/')
//   .on('data', chunk => {
//     // Menulis data yang diterima ke file HTML
//     console.log(chunk.toString());
//   })
//   .on('end', () => {
//     // Menulis footer HTML dan menutup file
//     fileStream.write('</div>\n</body>\n</html>');
//     fileStream.end();
//     console.log('Download selesai dan data telah disimpan ke file output.html');
//   })
//   .on('error', err => {
//     console.error('Terjadi kesalahan:', err.message);
//     fileStream.end(); // Pastikan stream file ditutup meskipun ada error
//   });


// TypeScript: import ytdl from '@distube/ytdl-core'; with --esModuleInterop
// TypeScript: import * as ytdl from '@distube/ytdl-core'; with --allowSyntheticDefaultImports
// TypeScript: import ytdl = require('@distube/ytdl-core'); with neither of the above
//const agent = ytdl.createProxyAgent({ uri: "https://vmess-sg01.globalssh.xyz" });

// Download a video
//  ytdl("https://www.youtube.com/watch?v=i0c46I_bJWc", { filter: 'audioonly' }).pipe(require("fs").createWriteStream("audio.mp3"));
//  ytdl("https://www.youtube.com/watch?v=i0c46I_bJWc").pipe(require("fs").createWriteStream("video.mp4"));



// Membuat interface readline untuk mengambil input dari konsol
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function showSpinner() {
  const spinnerFrames = ['|', '/', '-', '\\'];
  let i = 0;
  return setInterval(() => {
    process.stdout.write(`\r${spinnerFrames[i++ % spinnerFrames.length]} Loading...`);
  }, 100);
}
// Fungsi untuk menampilkan loading bar dan kecepatan unduhan
function showLoadingBar(downloadStream) {
  let downloaded = 0;
  let startTime = Date.now();

  // Menghitung ukuran total dengan mendengarkan event 'response'
  downloadStream.on('response', (response) => {
    const totalSize = parseInt(response.headers['content-length'], 10);

    // Set interval untuk update loading bar setiap 100ms
    const interval = setInterval(() => {
      const percentage = (downloaded / totalSize) * 100;
      const speed = (downloaded / 1024) / ((Date.now() - startTime) / 1000); // KB/s

      const filledLength = Math.floor(percentage / 5);
      const barLength = 20;

      // Pastikan nilai filledLength tidak kurang dari 0 dan tidak lebih dari barLength
      const bar = `[${"=".repeat(Math.max(0, Math.min(filledLength, barLength)))}${" ".repeat(barLength - Math.max(0, Math.min(filledLength, barLength))) }]`;

      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(`Downloading: ${bar} ${percentage.toFixed(2)}% (${speed.toFixed(2)} KB/s)`);
    }, 100);

    downloadStream.on('data', (chunk) => {
      downloaded += chunk.length; // Update jumlah yang telah diunduh
    });

    downloadStream.on('end', () => {
      clearInterval(interval); // Hentikan interval setelah unduhan selesai
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
    });
  });
}

// Meminta input URL dari pengguna
rl.question('Masukkan URL YouTube: ', (url) => {
  console.log(`URL yang dimasukkan: ${url}`);

  // Step 1: Download the audio only
  const audioStream = ytdl(url, { filter: 'audioonly' });
  showLoadingBar(audioStream);
  const audioWriteStream = fs.createWriteStream("audio.mp3");

  audioStream.pipe(audioWriteStream)
    .on('finish', () => {
      console.log('Unduhan audio selesai!');

      // Step 2: Download the video only
      const videoStream = ytdl(url);
      showLoadingBar(videoStream);
      const videoWriteStream = fs.createWriteStream("video.mp4");

      videoStream.pipe(videoWriteStream)
        .on('finish', () => {
          console.log('Unduhan video selesai!');

          const mergeSpinner = showSpinner();
          // Step 3: Merge audio and video into a single file
          ffmpeg()
            .addInput('video.mp4') // Tentukan file video
            .addInput('audio.mp3') // Tentukan file audio
            .outputOptions('-c:v copy') // Copy codec video tanpa re-encoding
            .outputOptions('-c:a aac') // Encode audio sebagai AAC
            .outputOptions('-strict experimental') // Izinkan codec eksperimental
            .save('output.mp4') // Tentukan file output
            .on('end', () => {
              clearInterval(mergeSpinner);
              console.log('Penggabungan selesai! Video final adalah output.mp4');
              rl.close(); // Menutup readline setelah proses selesai
            })
            .on('error', (err) => {
              console.error('Terjadi kesalahan saat penggabungan:', err);
              rl.close(); // Menutup readline jika terjadi error
            });
        })
        .on('error', (err) => {
          console.error('Terjadi kesalahan saat mengunduh video:', err);
          rl.close(); // Menutup readline jika terjadi error
        });
    })
    .on('error', (err) => {
      console.error('Terjadi kesalahan saat mengunduh audio:', err);
      rl.close(); // Menutup readline jika terjadi error
    });
});
// Get video info
// ytdl.getBasicInfo("https://www.youtube.com/watch?v=i0c46I_bJWc").then(info => {
//   console.log(info.title);
// });

// Get video info with download formats
// ytdl.getInfo("https://www.youtube.com/watch?v=i0c46I_bJWc").then(info => {
//   console.log(info.formats);
// });