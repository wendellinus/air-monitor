"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type Tab = {
  title: string;
  value: string;
  content?: React.ReactNode;
};

export const Tabs = ({
  tabs: propTabs,
  defaultValue,
  onValueChange,
  containerClassName,
  activeTabClassName,
  tabClassName,
  contentWrapperClassName,
  contentClassName,
  motionPreset = "default",
}: {
  tabs: Tab[];
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  containerClassName?: string;
  activeTabClassName?: string;
  tabClassName?: string;
  contentWrapperClassName?: string;
  contentClassName?: string;
  motionPreset?: "default" | "subtle" | "admin";
}) => {
  const initialTabs = useMemo<Tab[]>(() => {
    if (!defaultValue) return propTabs;
    const targetIndex = propTabs.findIndex((item) => item.value === defaultValue);
    if (targetIndex <= 0) return propTabs;
    const moved = [...propTabs];
    const selected = moved.splice(targetIndex, 1);
    moved.unshift(selected[0]);
    return moved;
  }, [defaultValue, propTabs]);
  const [active, setActive] = useState<Tab>(initialTabs[0] ?? propTabs[0]);
  const [tabs, setTabs] = useState<Tab[]>(initialTabs);

  useEffect(() => {
    setTabs(initialTabs);
    setActive(initialTabs[0] ?? propTabs[0]);
  }, [initialTabs, propTabs]);

  useEffect(() => {
    if (active?.value) onValueChange?.(active.value);
  }, [active, onValueChange]);

  const moveSelectedTabToTop = (idx: number) => {
    const newTabs = [...propTabs];
    const selectedTab = newTabs.splice(idx, 1);
    newTabs.unshift(selectedTab[0]);
    setTabs(newTabs);
    setActive(newTabs[0]);
  };

  const [hovering, setHovering] = useState(false);

  return (
    <>
      <div
        className={cn(
          "flex flex-row items-center justify-start [perspective:1000px] relative overflow-auto sm:overflow-visible no-visible-scrollbar max-w-full w-full",
          containerClassName
        )}
      >
        {propTabs.map((tab, idx) => (
          <button
            key={tab.title}
            onClick={() => {
              moveSelectedTabToTop(idx);
            }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            className={cn("relative px-4 py-2 rounded-full", tabClassName)}
            style={{
              transformStyle: "preserve-3d",
            }}
          >
            {active.value === tab.value && (
              <motion.div
                layoutId="clickedbutton"
                transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                className={cn(
                  "absolute inset-0 bg-gray-200 dark:bg-zinc-800 rounded-full ",
                  activeTabClassName
                )}
              />
            )}

            <span
              className={cn(
                "relative block",
                active.value === tab.value
                  ? "font-semibold text-slate-900"
                  : "text-slate-600 dark:text-white"
              )}
            >
              {tab.title}
            </span>
          </button>
        ))}
      </div>
      <FadeInDiv
        tabs={tabs}
        active={active}
        key={active.value}
        hovering={hovering}
        motionPreset={motionPreset}
        wrapperClassName={contentWrapperClassName}
        className={cn("mt-32", contentClassName)}
      />
    </>
  );
};

export const FadeInDiv = ({
  className,
  wrapperClassName,
  tabs,
  hovering,
  motionPreset = "default",
}: {
  className?: string;
  wrapperClassName?: string;
  key?: string;
  tabs: Tab[];
  active: Tab;
  hovering?: boolean;
  motionPreset?: "default" | "subtle" | "admin";
}) => {
  const isActive = (tab: Tab) => {
    return tab.value === tabs[0].value;
  };

  const cfg = motionPreset === "subtle"
    ? {
        scaleStep: 0.04,
        hoverLift: 8,
        maxVisibleLayers: 2,
        activeBounce: [0, 10, 0] as number[],
        inactiveOpacity: 0.1,
        inactiveBlur: 1,
      }
    : motionPreset === "admin"
      ? {
          scaleStep: 0.018,
          hoverLift: 0,
          maxVisibleLayers: 1,
          activeBounce: [0, 6, 0] as number[],
          inactiveOpacity: 0,
          inactiveBlur: 0,
        }
      : {
          scaleStep: 0.1,
          hoverLift: 50,
          maxVisibleLayers: 3,
          activeBounce: [0, 40, 0] as number[],
          inactiveOpacity: 0.3,
          inactiveBlur: 0,
        };

  return (
    <div className={cn("relative w-full h-full", wrapperClassName)}>
      {tabs.map((tab, idx) => (
        (() => {
          const activeLayer = isActive(tab);
          const hiddenByDepth = idx >= cfg.maxVisibleLayers;
          const layerOpacity = activeLayer ? 1 : hiddenByDepth ? 0 : cfg.inactiveOpacity;
          const layerBlur = activeLayer ? 0 : cfg.inactiveBlur;
          return (
        <motion.div
          key={tab.value}
          layoutId={tab.value}
          style={{
            scale: 1 - idx * cfg.scaleStep,
            top: hovering ? idx * -cfg.hoverLift : 0,
            zIndex: -idx,
            opacity: layerOpacity,
            filter: `blur(${layerBlur}px)`,
          }}
          animate={{
            y: activeLayer ? cfg.activeBounce : 0,
          }}
          className={cn(
            "w-full h-full absolute top-0 left-0",
            !activeLayer ? "pointer-events-none select-none" : undefined,
            className
          )}
        >
          {tab.content}
        </motion.div>
          );
        })()
      ))}
    </div>
  );
};
