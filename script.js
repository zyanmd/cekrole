let roles = [];
let guilds = [];
let assignedRoles = JSON.parse(localStorage.getItem('assignedRoles')) || []; // Ambil dari Local Storage

// Muat roles dan guilds dari file JSON
Promise.all([
    fetch('info/roles.json').then(response => response.json()),
    fetch('info/guilds.json').then(response => response.json())
])
.then(([rolesData, guildsData]) => {
    roles = rolesData;
    guilds = guildsData;
})
.catch(error => console.error('Error loading JSON:', error));

function assignRole() {
    const nameInput = document.getElementById('searchInput');
    const photoInput = document.getElementById('photoInput');
    const name = nameInput.value.trim();
    const file = photoInput.files[0]; // Ambil file yang diunggah
    const placeholderImage = 'nothing.jpg'; // Path ke gambar placeholder

    // Bersihkan hasil sebelumnya
    const resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = ''; // Kosongkan kontainer

    if (name && roles.length > 0 && guilds.length > 0) {
        const randomRole = roles[Math.floor(Math.random() * roles.length)];
        const randomGuild = guilds[Math.floor(Math.random() * guilds.length)];

        // Hasilkan persentase acak untuk setiap skill
        const randomPercentages = randomRole.skills.map(() => Math.floor(Math.random() * 100));
        const randomLevel = Math.floor(Math.random() * 100) + 1; // Level acak (1-100)

        const imageUrl = file ? URL.createObjectURL(file) : placeholderImage; // Gunakan foto yang diunggah atau placeholder

        // Tampilkan informasi role dan gambar yang diunggah
        displayRole(name, randomRole, randomPercentages, imageUrl, randomLevel, randomGuild);

        // Tambahkan ke assigned roles
        assignedRoles.push({
            name,
            role: randomRole.role,
            photo: imageUrl,
            roleImage: randomRole.img,
            percentages: randomPercentages,
            guild: randomGuild.name, // Ambil nama guild
            guildDescription: randomGuild.description, // Ambil deskripsi guild
            level: randomLevel // Tambahkan level
        });
        localStorage.setItem('assignedRoles', JSON.stringify(assignedRoles)); // Simpan ke Local Storage

        // Bersihkan input
        nameInput.value = '';
        resetFileInput(photoInput); // Gunakan fungsi untuk me-reset input file
    } else {
        resultContainer.textContent = !name ? 'Silakan masukkan nama orang.' : 'Data role atau guild tidak tersedia.';
    }
}

function resetFileInput(inputElement) {
    const newInput = inputElement.cloneNode(true); // Duplikasi input elemen
    inputElement.replaceWith(newInput); // Gantikan input lama dengan yang baru
}

function displayRole(name, role, percentages, imageUrl, randomLevel, randomGuild) {
    // Buat tampilan informasi role
    const resultContainer = document.getElementById('resultContainer');
    const roleInfo = document.createElement('div');
    roleInfo.className = 'role-info';
    
    // Gunakan innerHTML dengan cara yang aman
    roleInfo.innerHTML = `
        <img src="${imageUrl}" alt="${name}" style="max-width: 100px; border-radius: 8px; margin-top: 10px;">
        <h2>${name} mendapatkan role: ${role.role}</h2>
        <img src="${role.img}" alt="${role.role}" style="max-width: 150px; border-radius: 8px; margin-top: 10px;">
        <p>${role.description}</p>
        <p><strong>Guild:</strong> ${randomGuild.name}</p>
        <p><strong>Deskripsi Guild:</strong> ${randomGuild.description}</p>
        <p><strong>Level Kekuatan:</strong> ${randomLevel}</p>
        <ul>
            ${role.skills.map((skill, index) => `<li>${skill}: ${percentages[index]}%</li>`).join('')}
        </ul>
        <canvas id="radarChart-${name.replace(/\s/g, '-')}" style="max-width: 300px;"></canvas>
    `;
    resultContainer.prepend(roleInfo);

    // Render radar chart
    renderRadarChart(name.replace(/\s/g, '-'), percentages, role.role, role.skills);
}

// Fungsi untuk merender radar chart
function renderRadarChart(name, percentages, role, skills) {
    const ctx = document.getElementById(`radarChart-${name}`).getContext('2d');
    const radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: skills, // Labels for the skills
            datasets: [{
                label: role,
                data: percentages,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return `${tooltipItem.label}: ${tooltipItem.raw}%`; // Tampilkan persentase di tooltip
                        }
                    }
                }
            },
            scales: {
                r: {
                    angleLines: {
                        display: true
                    },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            }
        }
    });
}

// Fungsi untuk menyimpan hasil menjadi gambar dengan watermark
document.getElementById('saveAsImageButton').addEventListener('click', function() {
    const resultContainer = document.getElementById('resultContainer');
    
    html2canvas(resultContainer).then(canvas => {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Tambahkan watermark di pojok kanan bawah
        ctx.font = '20px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // Warna watermark dengan sedikit transparansi
        ctx.textAlign = 'right';
        ctx.fillText('Watermark © 2024', width - 10, height - 10);

        // Konversi canvas menjadi data URL untuk mengunduh sebagai gambar JPG
        canvas.toBlob(function(blob) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `result_${Date.now()}.jpg`; // Nama file dengan ekstensi .jpg
            link.click();
        }, 'image/jpeg', 0.95); // Simpan sebagai JPEG dengan kualitas 95%
    });
});

