import { addDoc, collection, doc, getDocs, setDoc } from "firebase/firestore";
import { defineStore } from "pinia";
import { ref } from "vue";

import { firestore } from "./firebase";
import { Project } from "./types";
import { ProjectCreationFormData } from "./views/NewProject.vue";

export const useProjectStore = defineStore("projects", () => {
  const projects = ref<Project[]>([]);

  const fetchProjects = () => {
    const projectsCollection = collection(firestore, "projects");

    return getDocs(projectsCollection)
      .then((querySnapshot) => {
        return querySnapshot.docs
          .map(
            (doc) =>
              ({
                _id: doc.id,
                ...doc.data(),
              }) as Project,
          )
          .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
      })
      .catch((error) => {
        console.log("Error getting documents: ", error);

        return [] as Project[];
      });
  };

  const refetch = () => {
    fetchProjects().then((data) => {
      projects.value = data;
    });
  };
  refetch();

  function upvoteProject(_id: string, uid?: string) {
    const project = projects.value.find((p) => p._id === _id);
    if (!project) return;
    const projectData = {
      ...project,
      upvotes: uid
        ? project.upvotes.includes(uid)
          ? project.upvotes.filter((projectUid) => projectUid !== uid)
          : [...project.upvotes, uid]
        : project.upvotes,
    };
    setDoc(doc(firestore, `projects/${_id}`), projectData)
      .then(() => {
        projects.value = projects.value.map((p) =>
          p._id === _id ? projectData : p,
        );
        // refetch();
      })
      .catch((error) => {
        console.error("Error writing document: ", error);
      });
  }

  function addProject(values: ProjectCreationFormData, userUid: string) {
    const projectCollection = collection(firestore, "projects");

    return addDoc(projectCollection, {
      title: values.title,
      description: values.description,
      textContent: values.content,
      links: values.links
        .split(",")
        .map((link) => link.trim())
        .filter((link) => link !== ""),
      tags: values.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== ""),
      projectId: "",
      userId: userUid,
      images: [],
      upvotes: [],
      createdAt: new Date(),
      logo: "",
    })
      .then((data) => {
        refetch();

        return Promise.resolve(data.id);
      })
      .catch((error) => {
        console.error("Error writing document: ", error);

        return Promise.reject();
      });
  }

  return {
    projects,
    refetch,
    upvoteProject,
    addProject,
  };
});
