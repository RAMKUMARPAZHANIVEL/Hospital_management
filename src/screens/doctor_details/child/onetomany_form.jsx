import React, { useState, useEffect } from "react";
import { ValidatorForm, TextValidator } from "react-material-ui-form-validator";
import { Box, Stack, Paper, Typography, IconButton, Button, Grid, Chip } from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import Helper from "shared/helper";

function getKeyIdName(config) {
  const key = config.find((x) => x.type === "keyid");
  if (!key) throw new Error("Config must contain a keyid item");
  return key.key;
}

function getEditableFields(config) {
  return config.filter((x) => x.type !== "keyid");
}

function createEmptyRow(config) {
  const row = {};
  config.forEach((c) => {
    if (c.type === "keyid") {
      row[c.key] = undefined;
    } else {
      row[c.key] = c.value ?? "";
    }
  });
  return row;
}

function diffPatch(original, current, editableFields) {
  const patch = {};
  for (const f of editableFields) {
    const k = f.key;
    if (original[k] !== current[k]) patch[k] = current[k];
  }
  return patch;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function QualificationRow({ row, config, mode, onSave, onDelete, onCancelNew }) {
  const keyId = getKeyIdName(config);
  const editableDefs = getEditableFields(config);

  const [editing, setEditing] = useState(!row[keyId] && mode !== "view");
  const [model, setModel] = useState(deepClone(row));
  const [original] = useState(deepClone(row));

  const isView = mode === "view";
  const isNew = !row[keyId];

  const handleChange = (key) => (e) => {
    const value = e?.target?.value ?? e;
    setModel((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const patch = diffPatch(original, model, editableDefs);
    if (isNew) {
      const payload = {};
      editableDefs.forEach((f) => (payload[f.key] = model[f.key]));
      setModel(deepClone(row));
      onSave({ mode: "add", payload });
    } else {
      onSave({ mode: "edit", id: row[keyId], payload: { ...patch, QualificationId : row[keyId] } });
    }
    setEditing(false);
  };

  const handleDelete = () => {
    if (isNew) {
      onCancelNew?.();
    } else {
      onDelete(row[keyId]);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle1" fontWeight={700}>
            {row.Degree|| "New qualification"}
          </Typography>
          {isNew && <Chip label="New" size="small" />}
          {!isView && !editing && (
            <Chip label="View" size="small" variant="outlined" />
          )}
        </Stack>
        <Stack direction="row" spacing={1}>
          {!isView && (
            <>
              {editing ? (
                <>
                  <IconButton aria-label="save" onClick={handleSave} size="small">
                    <SaveIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    aria-label={isNew ? "cancel" : "close"}
                    onClick={() => (isNew ? onCancelNew?.() : setEditing(false))}
                    size="small"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </>
              ) : (
                <IconButton aria-label="edit" onClick={() => setEditing(true)} size="small">
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
              <IconButton aria-label="delete" onClick={handleDelete} size="small">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Stack>
      </Stack>

      <ValidatorForm onSubmit={handleSave} instantValidate>
        <Grid container spacing={2}>
          {editableDefs.map((f) => (
            <Grid item xs={12} sm={6} md={4} key={f.key}>
              <TextValidator
                disabled={isView || !editing || f.editable === false}
                name={f.key}
                label={f.label}
                value={model[f.key] ?? ""}
                onChange={handleChange(f.key)}
                fullWidth
                size="small"
                variant="outlined"
                validators={f.validators || []}
                errorMessages={f.validationMessages || []}
              />
            </Grid>
          ))}
        </Grid>
      </ValidatorForm>
    </Paper>
  );
}

export default function Component({
  title = "Qualifications",
  config,
  values = [],
  mode = "edit",
  onCreate,
  onPatch,
  onDelete,
  onTableRowUpdated
}) {
  const keyId = getKeyIdName(config);
  const [rows, setRows] = useState(() => values.map((v) => deepClone(v)));

  useEffect(() => {
    setRows(values.map((v) => deepClone(v)));
  }, [values]);

  const addNewRow = () => {
    setRows((prev) => [{ __localId: Helper.GetGUID(), ...createEmptyRow(config) }, ...prev]);
  };

  const removeLocalNewRow = (localId) => {
    setRows((prev) => prev.filter((r) => r.__localId !== localId));
  };

  const handleSaveRow = ({ mode: saveMode, id, payload }) => {
    const actions = {id, action: saveMode};
     if (onTableRowUpdated) {
            onTableRowUpdated({ ...actions, rows, keyIdName: keyId, location: 'qualification', data: payload });
            // ClearSettings();
        }
    // if (saveMode === "create") {
    //   onCreate?.(payload);
    // } else if (saveMode === "patch") {
    //   if (patch && Object.keys(patch).length > 0) onPatch?.(id, patch);
    // }
  };

  const handleDeleteRow = (idOrLocal) => {
    const existing = rows.find((r) => r[keyId] === idOrLocal);
    if (existing) {
      onDelete?.(idOrLocal);
    } else {
      removeLocalNewRow(idOrLocal);
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={800}>
          {title}
        </Typography>
        {mode !== "view" && (
          <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={addNewRow}>
            Add {title}
          </Button>
        )}
      </Stack>

      <Stack spacing={2}>
        {rows.length === 0 && (
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography color="text.secondary">No qualifications added yet.</Typography>
          </Paper>
        )}

        {rows.map((r) => (
          <QualificationRow
            key={r[keyId] ?? r.__localId}
            row={r}
            config={config}
            mode={mode}
            onSave={(args) => handleSaveRow(args)}
            onDelete={(id) => handleDeleteRow(id)}
            onCancelNew={() => removeLocalNewRow(r.__localId)}
          />
        ))}
      </Stack>
    </Box>
  );
}
