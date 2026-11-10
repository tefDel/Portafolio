const rotatingWord = document.querySelector(".rotating-word");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

if (rotatingWord && !motionPreference.matches) {
    const words = [
        "experimentar",
        "explorar",
        "conectar",
        "interactuar",
        "visualizar",
        "transformar",
        "descubrir",
    ];
    let wordIndex = 0;

    window.setInterval(() => {
        rotatingWord.classList.add("is-changing");
        window.setTimeout(() => {
            wordIndex = (wordIndex + 1) % words.length;
            rotatingWord.textContent = words[wordIndex];
            requestAnimationFrame(() => {
                rotatingWord.classList.remove("is-changing");
            });
        }, 280);
    }, 2800);
}

const constellation = document.querySelector(".tech-constellation");
if (constellation) {
    const svg = constellation.querySelector(".tech-connections");
    const nodes = [...constellation.querySelectorAll(".tech-node")];
    const selectionLabel = constellation.querySelector(".tech-selection");
    const connections = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 6],
        [6, 7],
        [7, 8],
        [8, 9],
        [9, 10],
        [10, 11],
        [11, 12],
        [12, 13],
        [13, 0],
        [0, 8],
        [2, 11],
        [3, 5],
        [5, 9],
        [6, 12],
        [7, 10],
        [1, 13],
    ];

    connections.forEach(([from, to], index) => {
        const start = nodes[from];
        const end = nodes[to];
        const x1 = Number(start.dataset.x) * 10;
        const y1 = Number(start.dataset.y) * 6.2;
        const x2 = Number(end.dataset.x) * 10;
        const y2 = Number(end.dataset.y) * 6.2;
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.classList.add("tech-link");
        path.id = `tech-link-${index}`;
        path.dataset.from = String(from);
        path.dataset.to = String(to);
        path.setAttribute("d", `M ${x1} ${y1} L ${x2} ${y2}`);
        svg.append(path);

        if (index % 3 === 0) {
            const particle = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "circle",
            );
            particle.classList.add("tech-particle");
            particle.setAttribute("r", "3");

            const motion = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "animateMotion",
            );
            motion.setAttribute("dur", `${3 + (index % 4)}s`);
            motion.setAttribute("begin", `${(index % 5) * -0.7}s`);
            motion.setAttribute("repeatCount", "indefinite");
            motion.setAttribute("path", `M ${x1} ${y1} L ${x2} ${y2}`);
            particle.append(motion);
            svg.append(particle);
        }
    });

    let selectedNode = null;
    let hoveredNode = null;

    const updateConnections = () => {
        const activeNode = hoveredNode ?? selectedNode;

        nodes.forEach((node, index) => {
            node.classList.toggle(
                "is-connected",
                activeNode !== null &&
                    connections.some(
                        ([from, to]) =>
                            (from === activeNode && to === index) ||
                            (to === activeNode && from === index),
                    ),
            );
        });

        svg.querySelectorAll(".tech-link").forEach((path) => {
            path.classList.toggle(
                "is-connected",
                activeNode !== null &&
                    (Number(path.dataset.from) === activeNode ||
                        Number(path.dataset.to) === activeNode),
            );
        });
    };

    nodes.forEach((node, index) => {
        node.addEventListener("pointerenter", () => {
            hoveredNode = index;
            updateConnections();
        });
        node.addEventListener("pointerleave", () => {
            hoveredNode = null;
            updateConnections();
        });
        node.addEventListener("focus", () => {
            hoveredNode = index;
            updateConnections();
        });
        node.addEventListener("blur", () => {
            hoveredNode = null;
            updateConnections();
        });
        node.addEventListener("click", () => {
            selectedNode = selectedNode === index ? null : index;
            nodes.forEach((item, itemIndex) => {
                const isSelected = itemIndex === selectedNode;
                item.classList.toggle("is-selected", isSelected);
                item.setAttribute("aria-pressed", String(isSelected));
            });
            selectionLabel.textContent =
                selectedNode === null
                    ? "Selecciona una herramienta para explorar sus conexiones"
                    : `${node.dataset.tech} — conexiones resaltadas`;
            updateConnections();
        });
    });
}
