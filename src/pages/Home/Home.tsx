import { useRef } from "react";
import Curve from "../../components/Curve";
import { useScroll, useTransform, motion } from "framer-motion";
import Introduce from "./partials/Introduce";
import WhatWeHave from "./partials/WhatWeHave";

export default function Home() {
  const container = useRef();

  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0vh", "150vh"]);
  return (
    <Curve>
      <div className="w-screen h-screen overflow-hidden">
        <motion.div style={{ y }} className="relative h-full">
          <img
            src={"/images/home-page-banner.jpg"}
            alt="image"
            className="w-full h-full object-cover"
          />
          <div className="w-full h-full absolute top-0 z-20 text-zinc-200 bg-black/60">
            <div className="absolute top-56 left-10 text-8xl">
              <div className="space-mono text-[100px]">Triết học</div>
              <div className="orbitron pt-16 text-[200px]">& AI</div>
            </div>
          </div>
        </motion.div>
      </div>
      {/* This component make an redundant space in the x-axis that make the whole page overflow-x */}
      <div className="w-screen overflow-hidden flex flex-col justify-center pt-10">
        <div className="uppercase text-center pb-10 text-3xl font-semibold">
          thành viên
        </div>
        <Slide />
      </div>
      <Introduce />
      <div className="w-[500px] h-0.5 bg-black text-black mx-20" />
      <WhatWeHave />
    </Curve>
  );
}

const Slide = () => {
  // const direction = props.direction == "left" ? -1 : 1;

  // const translateX = useTransform(
  //   props.progress,
  //   [0, 1],
  //   [150 * direction, -150 * direction]
  // );

  return (
    <motion.div
      // style={{ x: translateX, left: props.left }}
      className="relative"
    >
      <div className="relative grid whitespace-nowrap items-center grid-cols-3 gap-40 px-16 space-mono">
        <div
          className="team-member"
          style={{
            backgroundImage: `url("./images/hai.jpg")`,
          }}
        >
          <div className="rounded-b-3xl text-white absolute bottom-0 w-full text-center py-4 bg-linear-to-r from-cyan-500 to-blue-500">
            <div>Hải</div>
            <div>Nội dung</div>
          </div>
        </div>
        <div
          className="team-member"
          style={{
            backgroundImage: `url("./images/hoang.jpg")`,
          }}
        >
          <div className="rounded-b-3xl text-white absolute bottom-0 w-full text-center py-4 bg-linear-to-r from-cyan-500 to-blue-500">
            <div>Hoàng</div>
            <div>Coder</div>
          </div>
        </div>
        <div
          className="team-member"
          style={{
            backgroundImage: `url("./images/sang.jpg")`,
          }}
        >
          <div className="rounded-b-3xl text-white absolute bottom-0 w-full text-center py-4 bg-linear-to-r from-cyan-500 to-blue-500">
            <div>Sang</div>
            <div>Truyền thông</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
