package com.physicslab.ai.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Result of a 混元生3D (Hunyuan 3D) generation job.
 *
 * <p>Contains the job status, generated 3D model file URLs (OBJ, GLB, etc.),
 * and a preview image URL. Populated by {@code Hunyuan3DService} after
 * polling the query endpoint until the job reaches a terminal state
 * (DONE / FAIL).</p>
 */
public class Hunyuan3DResult {

    /** The job ID returned by the submit endpoint. */
    private String jobId;

    /** Final job status: DONE, FAIL, or TIMEOUT (if polling exceeded max time). */
    private String status;

    /** The text prompt submitted to the 3D generation API. */
    private String prompt;

    /** List of generated 3D model files (Type + Url + PreviewImageUrl). */
    private List<ModelFile> modelFiles = new ArrayList<>();

    /** Error message if status is FAIL or TIMEOUT; null otherwise. */
    private String error;

    // ---- Inner class: a single 3D model file ----

    public static class ModelFile {
        /** File format: OBJ, GLB, STL, USDZ, FBX, etc. */
        private String type;
        /** Download URL for the 3D model file (temporary COS link). */
        private String url;
        /** Preview image URL (PNG). */
        private String previewImageUrl;

        public ModelFile() {}

        public ModelFile(String type, String url, String previewImageUrl) {
            this.type = type;
            this.url = url;
            this.previewImageUrl = previewImageUrl;
        }

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
        public String getPreviewImageUrl() { return previewImageUrl; }
        public void setPreviewImageUrl(String previewImageUrl) { this.previewImageUrl = previewImageUrl; }
    }

    // ---- Constructors ----

    public Hunyuan3DResult() {}

    public Hunyuan3DResult(String jobId, String status) {
        this.jobId = jobId;
        this.status = status;
    }

    // ---- Getters / Setters ----

    public String getJobId() { return jobId; }
    public void setJobId(String jobId) { this.jobId = jobId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }

    public List<ModelFile> getModelFiles() { return modelFiles; }
    public void setModelFiles(List<ModelFile> modelFiles) { this.modelFiles = modelFiles; }

    public String getError() { return error; }
    public void setError(String error) { this.error = error; }

    /** Convenience: return the first GLB file URL, or null if none. */
    public String getGlbUrl() {
        return modelFiles.stream()
                .filter(f -> "GLB".equalsIgnoreCase(f.getType()))
                .map(ModelFile::getUrl)
                .findFirst()
                .orElse(null);
    }

    /** Convenience: return the first OBJ file URL, or null if none. */
    public String getObjUrl() {
        return modelFiles.stream()
                .filter(f -> "OBJ".equalsIgnoreCase(f.getType()))
                .map(ModelFile::getUrl)
                .findFirst()
                .orElse(null);
    }

    /** Convenience: return the first preview image URL, or null if none. */
    public String getPreviewImageUrl() {
        return modelFiles.stream()
                .map(ModelFile::getPreviewImageUrl)
                .filter(u -> u != null && !u.isBlank())
                .findFirst()
                .orElse(null);
    }
}
