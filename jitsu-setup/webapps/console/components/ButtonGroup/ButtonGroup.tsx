import { Button, Dropdown, MenuProps, Tooltip } from "antd";
import React from "react";
import { JitsuButton } from "../JitsuButton/JitsuButton";
import { BaseButtonProps } from "antd/lib/button/button";
import styles from "./ButtonGroup.module.css";
import { useWorkspace, useWorkspaceRole } from "../../lib/context";
import { MoreHorizontal, MoreVertical } from "lucide-react";
import Link from "next/link";
import { hasPermission, WorkspacePermissionsType } from "../../lib/workspace-roles";

const AntButtonGroup = Button.Group;

export type ButtonProps = Omit<BaseButtonProps, "children" | "type"> & {
  href?: string;
  label?: React.ReactNode;
  collapsed?: boolean;
  // if label is not a string, tooltip text will be used for Tooltip
  tooltip?: string;
  onClick?: () => void;
  requiredPermission?: WorkspacePermissionsType;
};

export type ButtonGroupProps = {
  items: ButtonProps[];
  dotsButtonProps?: BaseButtonProps;
  dotsOrientation?: "horizontal" | "vertical";
};

export const ButtonGroup: React.FC<ButtonGroupProps> = ({ items, dotsButtonProps, dotsOrientation = "vertical" }) => {
  const w = useWorkspace();
  const workspaceRole = useWorkspaceRole();
  const shownItems = items.filter(item => !item.collapsed);
  const dropdownItems: MenuProps["items"] = items
    .filter(item => item.collapsed)
    .map((item, i) => ({
      label: item.href ? (
        <Link prefetch={false} href={`/${w.slug || w.id}${item.href}`}>
          {item.label}
        </Link>
      ) : (
        item.label
      ),
      key: i,
      icon: item.icon,
      disabled:
        item.disabled ||
        (item.requiredPermission ? !hasPermission(workspaceRole.role, item.requiredPermission) : false),
      danger: item.danger,
      onClick: item.onClick,
    }));

  return (
    <AntButtonGroup className={styles.buttonGroup}>
      {shownItems.map((item, i) => (
        <Tooltip title={typeof item.label === "string" ? item.label : item.tooltip} key={i}>
          <JitsuButton {...item} key={i} ws={!!item.href} requiredPermission={item.requiredPermission} />
        </Tooltip>
      ))}
      {dropdownItems.length > 0 && (
        <Dropdown trigger={["click"]} menu={{ items: dropdownItems }}>
          <JitsuButton
            className="text-lg font-bold p-0"
            icon={
              dotsOrientation === "vertical" ? (
                <MoreVertical className={"w-4 h-4"} />
              ) : (
                <MoreHorizontal className={"w-4 h-4"} />
              )
            }
            onClick={event => {
              event.preventDefault();
              event.stopPropagation(); // stop propagation main button
            }}
            {...dotsButtonProps}
          />
        </Dropdown>
      )}
    </AntButtonGroup>
  );
};
