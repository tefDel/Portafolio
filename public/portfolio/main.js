const cursor = document.querySelector(".cursor-dot");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealItems = document.querySelectorAll(
    ".project,.manifesto-main,.manifesto-meta",
);

if (cursor && !reduceMotion.matches) {
    const interactiveElements = document.querySelectorAll(
        "a, button, .project-visual, .case-visual",
    );

    window.addEventListener("pointermove", (event) => {
        if (event.pointerType === "touch") return;
        cursor.style.left = `${event.clientX}px`;
        cursor.style.top = `${event.clientY}px`;
    });

    interactiveElements.forEach((element) => {
        element.addEventListener("pointerenter", () => {
            cursor.classList.add("is-hovering");
        });
        element.addEventListener("pointerleave", () => {
            cursor.classList.remove("is-hovering");
        });
    });
}

if (!reduceMotion.matches) {
    const heroStage = document.querySelector(".hero-stage");
    if (heroStage) {
        let parallaxFrame = 0;
        const updateScrollParallax = () => {
            parallaxFrame = 0;
            const progress = Math.min(
                Math.max(window.scrollY / (window.innerHeight * 0.8), 0),
                1,
            );
            heroStage.style.setProperty(
                "--scroll-portrait-y",
                `${-progress * 20}px`,
            );
            heroStage.style.setProperty(
                "--scroll-panel-y",
                `${progress * 24}px`,
            );
        };
        const scheduleScrollParallax = () => {
            if (parallaxFrame) return;
            parallaxFrame = requestAnimationFrame(updateScrollParallax);
        };

        window.addEventListener("scroll", scheduleScrollParallax, {
            passive: true,
        });
        window.addEventListener("resize", scheduleScrollParallax);
        scheduleScrollParallax();
    }

    let observer;
    revealItems.forEach((element, index) => {
        element.style.setProperty("--reveal-delay", `${index * 50}ms`);
        element.classList.add("will-reveal");
    });

    if ("IntersectionObserver" in window) {
        observer = new IntersectionObserver(
            (entries) =>
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    }
                }),
            { threshold: 0.12 },
        );
        revealItems.forEach((element) => observer.observe(element));
    }

    let revealFrame = 0;
    const revealVisibleItems = () => {
        revealFrame = 0;
        revealItems.forEach((element) => {
            const bounds = element.getBoundingClientRect();
            if (bounds.top < window.innerHeight * 0.9 && bounds.bottom > 0) {
                element.classList.add("is-visible");
                observer?.unobserve(element);
            }
        });
    };
    const scheduleRevealCheck = () => {
        if (revealFrame) return;
        revealFrame = requestAnimationFrame(revealVisibleItems);
    };

    window.addEventListener("scroll", scheduleRevealCheck, { passive: true });
    window.addEventListener("resize", scheduleRevealCheck);
    scheduleRevealCheck();
}

document.querySelectorAll('a[href^="#"]').forEach((link) =>
    link.addEventListener("click", (event) => {
        const target = document.querySelector(link.getAttribute("href"));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({
            behavior: reduceMotion.matches ? "auto" : "smooth",
        });
    }),
);

document.querySelectorAll(".project-visual[data-preview-number], .case-visual[data-preview-number]").forEach((preview) => {
    let touchStart = null;
    let touchDragged = false;
    let suppressClick = false;

    const moveNumber = (event) => {
        const bounds = preview.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;
        preview.style.setProperty(
            "--preview-x",
            `${Math.max(-38, Math.min(38, (x - 0.5) * 76))}px`,
        );
        preview.style.setProperty(
            "--preview-y",
            `${Math.max(-24, Math.min(24, (y - 0.5) * 48))}px`,
        );
        preview.style.setProperty(
            "--preview-rotate",
            `${((x - 0.5) * 18).toFixed(1)}deg`,
        );
        preview.classList.add("is-preview-active");
    };

    preview.addEventListener("pointerdown", (event) => {
        if (event.pointerType !== "touch") return;
        touchStart = { x: event.clientX, y: event.clientY };
        touchDragged = false;
        preview.setPointerCapture(event.pointerId);
        moveNumber(event);
    });

    preview.addEventListener("pointermove", (event) => {
        if (event.pointerType === "touch") {
            if (!touchStart) return;
            const dx = event.clientX - touchStart.x;
            const dy = event.clientY - touchStart.y;
            if (Math.hypot(dx, dy) > 8) touchDragged = true;
            if (touchDragged && Math.abs(dx) > Math.abs(dy)) {
                event.preventDefault();
                moveNumber(event);
            }
            return;
        }
        moveNumber(event);
    });

    preview.addEventListener("pointerup", (event) => {
        if (event.pointerType !== "touch") return;
        if (touchDragged) {
            suppressClick = true;
            window.setTimeout(() => {
                suppressClick = false;
            }, 500);
        }
        touchStart = null;
        window.setTimeout(() => {
            preview.classList.remove("is-preview-active");
        }, 700);
    });

    preview.addEventListener("pointercancel", () => {
        touchStart = null;
        preview.classList.remove("is-preview-active");
    });

    preview.addEventListener(
        "click",
        (event) => {
            if (!suppressClick) return;
            event.preventDefault();
            event.stopPropagation();
            suppressClick = false;
        },
        true,
    );

    preview.addEventListener("pointerleave", (event) => {
        if (event.pointerType === "touch") return;
        preview.classList.remove("is-preview-active");
        preview.style.removeProperty("--preview-x");
        preview.style.removeProperty("--preview-y");
        preview.style.removeProperty("--preview-rotate");
    });
});

document.querySelectorAll(".video-block").forEach((gallery) => {
    const shell = gallery.querySelector(".video-shell");
    if (!shell) return;

    let slides = [...shell.querySelectorAll(":scope > [data-gallery-slide]")];
    if (slides.length === 0) {
        const firstSlide = document.createElement("div");
        firstSlide.className = "gallery-slide";
        firstSlide.dataset.gallerySlide = "";
        firstSlide.append(...shell.childNodes);
        shell.append(firstSlide);
        slides = [firstSlide];
    }

    slides.forEach((slide) => slide.dataset.gallerySlide = "");

    const hasRealMedia = slides.some((slide) =>
        slide.querySelector("img, video, iframe, source"),
    );

    if (!hasRealMedia && slides.length < 3) {
        while (slides.length < 3) {
            const slide = document.createElement("div");
            slide.className = "gallery-slide";
            slide.dataset.gallerySlide = "";
            const placeholder = document.createElement("div");
            placeholder.className = "gallery-placeholder";
            const label = document.createElement("span");
            label.textContent = `IMAGEN O VIDEO / ${String(slides.length + 1).padStart(2, "0")}`;
            const instructions = document.createElement("p");
            instructions.textContent =
                "Reemplaza esta tarjeta por una imagen o video (../../../assets/tu-archivo.jpg o .mp4). Duplica este panel para añadir diapositivas.";
            placeholder.append(label, instructions);
            slide.append(placeholder);
            shell.append(slide);
            slides.push(slide);
        }
    }

    gallery.classList.add("media-gallery");
    shell.setAttribute("aria-live", "polite");
    shell.setAttribute("aria-roledescription", "carrusel");

    const status = gallery.querySelector(".video-head span:last-child");
    if (status) {
        status.classList.add("gallery-status");
        status.setAttribute("aria-live", "polite");
    }

    const controls = document.createElement("div");
    controls.className = "gallery-controls";
    const previous = document.createElement("button");
    previous.type = "button";
    previous.className = "gallery-arrow";
    previous.setAttribute("aria-label", "Diapositiva anterior");
    previous.textContent = "←";
    const dots = document.createElement("div");
    dots.className = "gallery-dots";
    dots.setAttribute("role", "group");
    dots.setAttribute("aria-label", "Elegir diapositiva");
    const next = document.createElement("button");
    next.type = "button";
    next.className = "gallery-arrow";
    next.setAttribute("aria-label", "Siguiente diapositiva");
    next.textContent = "→";
    controls.append(previous, dots, next);
    gallery.append(controls);

    let activeIndex = 0;
    const dotButtons = slides.map((slide, index) => {
        slide.classList.add("gallery-slide");
        slide.setAttribute("role", "group");
        slide.setAttribute("aria-roledescription", "diapositiva");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "gallery-dot";
        button.setAttribute("aria-label", `Ir a la diapositiva ${index + 1}`);
        button.addEventListener("click", () => showSlide(index));
        dots.append(button);
        return button;
    });

    function showSlide(index) {
        activeIndex = (index + slides.length) % slides.length;
        slides.forEach((slide, slideIndex) => {
            const isActive = slideIndex === activeIndex;
            slide.hidden = !isActive;
            slide.classList.toggle("is-active", isActive);
            slide.setAttribute("aria-label", `${slideIndex + 1} de ${slides.length}`);
        });
        dotButtons.forEach((button, buttonIndex) => {
            const isActive = buttonIndex === activeIndex;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-current", isActive ? "true" : "false");
        });
        if (status) {
            status.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
        }
    }

    previous.addEventListener("click", () => showSlide(activeIndex - 1));
    next.addEventListener("click", () => showSlide(activeIndex + 1));
    showSlide(activeIndex);

    let swipeStart = null;
    shell.addEventListener("pointerdown", (event) => {
        if (
            event.pointerType !== "touch" ||
            event.target.closest("iframe, video, audio, button")
        ) {
            return;
        }
        swipeStart = { x: event.clientX, y: event.clientY };
    });
    shell.addEventListener("pointerup", (event) => {
        if (!swipeStart) return;
        const dx = event.clientX - swipeStart.x;
        const dy = event.clientY - swipeStart.y;
        swipeStart = null;
        if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
        showSlide(activeIndex + (dx < 0 ? 1 : -1));
    });
    shell.addEventListener("pointercancel", () => {
        swipeStart = null;
    });
});

if (!reduceMotion.matches) {
    const pointerTargets = document.querySelectorAll(
        ".hero-stage, .project-visual, .case-visual, .tech-constellation, .contact",
    );

    pointerTargets.forEach((element) => {
        element.addEventListener("pointermove", (event) => {
            if (event.pointerType === "touch") return;

            const bounds = element.getBoundingClientRect();
            const x = (event.clientX - bounds.left) / bounds.width;
            const y = (event.clientY - bounds.top) / bounds.height;
            const tiltX = (0.5 - y) * 5;
            const tiltY = (x - 0.5) * 5;

            element.style.setProperty("--pointer-x", `${x * 100}%`);
            element.style.setProperty("--pointer-y", `${y * 100}%`);
            element.style.setProperty("--tilt-x", `${tiltX}deg`);
            element.style.setProperty("--tilt-y", `${tiltY}deg`);
            element.style.setProperty("--parallax-x", `${(x - 0.5) * 12}px`);
            element.style.setProperty("--parallax-y", `${(y - 0.5) * 12}px`);
            element.style.setProperty(
                "--panel-parallax-x",
                `${(0.5 - x) * 7.8}px`,
            );
            element.style.setProperty(
                "--panel-parallax-y",
                `${(0.5 - y) * 7.8}px`,
            );
            element.style.setProperty(
                "--contact-parallax-x",
                `${(x - 0.5) * 10}px`,
            );
            element.style.setProperty(
                "--contact-parallax-y",
                `${(y - 0.5) * 10}px`,
            );
            element.classList.add("is-pointer-active");
        });

        element.addEventListener("pointerleave", () => {
            [
                "--tilt-x",
                "--tilt-y",
                "--parallax-x",
                "--parallax-y",
                "--panel-parallax-x",
                "--panel-parallax-y",
                "--contact-parallax-x",
                "--contact-parallax-y",
                "--pointer-x",
                "--pointer-y",
            ].forEach((property) => element.style.removeProperty(property));
            element.classList.remove("is-pointer-active");
        });
    });
}
