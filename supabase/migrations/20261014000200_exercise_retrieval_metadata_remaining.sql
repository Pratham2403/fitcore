-- Classifies catalog rows the generated retrieval-metadata migration did not cover.
UPDATE public.exercises SET movement_pattern = 'triceps' WHERE id = 'Kettlebell_Overhead_Triceps_Extension';
UPDATE public.exercises SET movement_pattern = 'shoulder_iso' WHERE id IN ('Kettlebell_Halo', 'Kettlebell_Halo_With_Overhead_Extension');
UPDATE public.exercises SET movement_pattern = 'horizontal_push' WHERE id = 'Neck_Press';
