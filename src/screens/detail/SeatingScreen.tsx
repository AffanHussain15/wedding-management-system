import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ScreenContainer, AppText, BackButton, Button, Input, Icon, Avatar } from '@components';
import { useWedding } from '@store';
import type { ID, SeatingTable } from '@types';
import { colors, radius, shadows, spacing, typography, weight } from '@theme';
import { useAppNavigation } from '@navigation/hooks';

export function SeatingScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  const { state, actions } = useWedding();
  const { guests, tables } = state;

  // Which table new taps seat guests at, and which one is being renamed.
  const [activeId, setActiveId] = useState<ID | null>(null);
  const [editingId, setEditingId] = useState<ID | null>(null);
  const [draftName, setDraftName] = useState('');

  const effectiveActiveId = activeId ?? tables[0]?.id ?? null;
  const activeTable = tables.find(t => t.id === effectiveActiveId) ?? null;

  const guestById = new Map(guests.map(g => [g.id, g]));
  const assignedIds = new Set(tables.flatMap(t => t.guestIds));
  const unassigned = guests.filter(g => !assignedIds.has(g.id));

  const startRename = (table: SeatingTable) => {
    setActiveId(table.id);
    setEditingId(table.id);
    setDraftName(table.name);
  };

  const commitRename = () => {
    if (editingId != null) {
      actions.renameTable(editingId, draftName.trim() || 'Table');
    }
    setEditingId(null);
  };

  const deleteTable = (id: ID) => {
    actions.removeTable(id);
    if (activeId === id) setActiveId(null);
    if (editingId === id) setEditingId(null);
  };

  const seatGuest = (guestId: ID) => {
    if (effectiveActiveId != null) actions.assignGuest(effectiveActiveId, guestId);
  };

  return (
    <ScreenContainer scroll padded={false} edges={['top']} contentContainerStyle={styles.content}>
      <BackButton onPress={() => nav.goBack()} />
      <AppText style={[typography.serifValue, styles.title]}>Seating Planner</AppText>
      <AppText variant="callout" color={colors.textSecondary} style={styles.subtitle}>
        Pick a table, then tap guests below to seat them.
      </AppText>

      {tables.map(table => {
        const active = table.id === effectiveActiveId;
        const editing = table.id === editingId;

        return (
          <Pressable
            key={table.id}
            onPress={() => setActiveId(table.id)}
            style={[styles.table, active && styles.tableActive]}>
            <View style={styles.tableHeader}>
              {editing ? (
                <Input
                  value={draftName}
                  onChangeText={setDraftName}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={commitRename}
                  onBlur={commitRename}
                  style={styles.nameInput}
                />
              ) : (
                <View style={styles.tableTitle}>
                  <AppText variant="title">{table.name}</AppText>
                  <AppText variant="caption" color={colors.textSecondary} style={styles.count}>
                    {table.guestIds.length}{' '}
                    {table.guestIds.length === 1 ? 'guest' : 'guests'}
                  </AppText>
                </View>
              )}

              <View style={styles.tableActions}>
                {editing ? (
                  <Pressable onPress={commitRename} hitSlop={8} style={styles.iconBtn}>
                    <Icon name="check" size={18} color={colors.success} />
                  </Pressable>
                ) : (
                  <>
                    <Pressable onPress={() => startRename(table)} hitSlop={8} style={styles.iconBtn}>
                      <Icon name="pencil" size={16} color={colors.textSecondary} />
                    </Pressable>
                    <Pressable onPress={() => deleteTable(table.id)} hitSlop={8} style={styles.iconBtn}>
                      <Icon name="trash" size={16} color={colors.danger} />
                    </Pressable>
                  </>
                )}
              </View>
            </View>

            <View style={styles.chips}>
              {table.guestIds.map(id => {
                const g = guestById.get(id);
                if (!g) return null;
                return (
                  <Pressable
                    key={id}
                    style={styles.chip}
                    onPress={() => actions.unassignGuest(id)}>
                    <Avatar name={g.name} size={22} />
                    <AppText variant="caption" color={colors.text} style={styles.chipName}>
                      {g.name}
                    </AppText>
                    <Icon name="close" size={12} color={colors.textMuted} />
                  </Pressable>
                );
              })}
              {table.guestIds.length === 0 ? (
                <AppText variant="caption" color={colors.textMuted}>
                  No guests yet — tap a name below.
                </AppText>
              ) : null}
            </View>
          </Pressable>
        );
      })}

      <Button
        label="+ Add table"
        variant="outline"
        onPress={() => actions.addTable(`Table ${tables.length + 1}`)}
        style={styles.addBtn}
      />

      <AppText style={[typography.serifHeading, styles.sectionTitle]}>
        Unassigned · {unassigned.length}
      </AppText>
      <AppText variant="caption" color={colors.textSecondary} style={styles.hint}>
        {activeTable
          ? `Tap to seat at “${activeTable.name}”.`
          : 'Add a table to start seating.'}
      </AppText>

      <View style={styles.guests}>
        {unassigned.map(g => (
          <Pressable
            key={g.id}
            style={styles.pill}
            disabled={!activeTable}
            onPress={() => seatGuest(g.id)}>
            <Avatar name={g.name} size={26} />
            <AppText variant="caption" color={colors.text} style={styles.pillName}>
              {g.name}
            </AppText>
          </Pressable>
        ))}
        {unassigned.length === 0 ? (
          <AppText variant="callout" color={colors.textMuted}>
            Everyone has a seat 🎉
          </AppText>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  title: {
    marginTop: spacing.base,
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.lg,
  },
  table: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  tableActive: {
    borderColor: colors.primary,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  tableTitle: {
    flexShrink: 1,
  },
  count: {
    marginTop: spacing.xxs,
  },
  tableActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconBtn: {
    padding: spacing.xs,
  },
  nameInput: {
    flex: 1,
    minHeight: 44,
    paddingVertical: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingVertical: spacing.xxs,
    paddingLeft: spacing.xxs,
    paddingRight: spacing.sm,
  },
  chipName: {
    ...weight('semiBold'),
  },
  addBtn: {
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.xxs,
  },
  hint: {
    marginBottom: spacing.base,
  },
  guests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.xs,
    paddingRight: spacing.md,
    ...shadows.sm,
  },
  pillName: {
    ...weight('semiBold'),
  },
});
