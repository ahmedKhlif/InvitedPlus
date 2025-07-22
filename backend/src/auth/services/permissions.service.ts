import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';

export interface Permission {
  resource: string;
  action: string;
  condition?: (user: any, resource?: any) => boolean;
}

@Injectable()
export class PermissionsService {
  private permissions: Map<Role, Permission[]> = new Map();

  constructor() {
    this.initializePermissions();
  }

  private initializePermissions() {
    // ADMIN permissions - Full access to everything
    this.permissions.set(Role.ADMIN, [
      // Users
      { resource: 'users', action: 'create' },
      { resource: 'users', action: 'read' },
      { resource: 'users', action: 'update' },
      { resource: 'users', action: 'delete' },
      { resource: 'users', action: 'manage_roles' },
      
      // Events
      { resource: 'events', action: 'create' },
      { resource: 'events', action: 'read' },
      { resource: 'events', action: 'update' },
      { resource: 'events', action: 'delete' },
      { resource: 'events', action: 'manage_all' },
      
      // Tasks
      { resource: 'tasks', action: 'create' },
      { resource: 'tasks', action: 'read' },
      { resource: 'tasks', action: 'update' },
      { resource: 'tasks', action: 'delete' },
      { resource: 'tasks', action: 'assign' },
      
      // Polls
      { resource: 'polls', action: 'create' },
      { resource: 'polls', action: 'read' },
      { resource: 'polls', action: 'update' },
      { resource: 'polls', action: 'delete' },
      { resource: 'polls', action: 'manage_all' },
      
      // Chat
      { resource: 'chat', action: 'read' },
      { resource: 'chat', action: 'write' },
      { resource: 'chat', action: 'moderate' },
      { resource: 'chat', action: 'delete_messages' },
      
      // Admin
      { resource: 'admin', action: 'access_panel' },
      { resource: 'admin', action: 'view_analytics' },
      { resource: 'admin', action: 'manage_platform' },
    ]);

    // ORGANIZER permissions - Can create and manage events, tasks, polls
    this.permissions.set(Role.ORGANIZER, [
      // Events - Can create and manage own events
      { resource: 'events', action: 'create' },
      { resource: 'events', action: 'read' },
      { 
        resource: 'events', 
        action: 'update',
        condition: (user, event) => event?.createdById === user.id
      },
      { 
        resource: 'events', 
        action: 'delete',
        condition: (user, event) => event?.createdById === user.id
      },
      
      // Tasks - Can create and manage tasks for own events
      { resource: 'tasks', action: 'create' },
      { resource: 'tasks', action: 'read' },
      { 
        resource: 'tasks', 
        action: 'update',
        condition: (user, task) => task?.createdById === user.id || task?.assigneeId === user.id
      },
      { 
        resource: 'tasks', 
        action: 'delete',
        condition: (user, task) => task?.createdById === user.id
      },
      { 
        resource: 'tasks', 
        action: 'assign',
        condition: (user, task) => task?.createdById === user.id
      },
      
      // Polls - Can create and manage polls for own events
      { resource: 'polls', action: 'create' },
      { resource: 'polls', action: 'read' },
      { 
        resource: 'polls', 
        action: 'update',
        condition: (user, poll) => poll?.createdById === user.id
      },
      { 
        resource: 'polls', 
        action: 'delete',
        condition: (user, poll) => poll?.createdById === user.id
      },
      
      // Chat - Can participate in chats for events they're involved in
      { resource: 'chat', action: 'read' },
      { resource: 'chat', action: 'write' },
      
      // Profile
      { resource: 'profile', action: 'read' },
      { resource: 'profile', action: 'update' },
    ]);

    // GUEST permissions - Read-only access, can participate but not create
    this.permissions.set(Role.GUEST, [
      // Events - Can view and RSVP to events
      { resource: 'events', action: 'read' },
      { resource: 'events', action: 'rsvp' },
      
      // Tasks - Can view tasks and update assigned tasks
      { resource: 'tasks', action: 'read' },
      { 
        resource: 'tasks', 
        action: 'update',
        condition: (user, task) => task?.assigneeId === user.id
      },
      
      // Polls - Can view and vote on polls
      { resource: 'polls', action: 'read' },
      { resource: 'polls', action: 'vote' },
      
      // Chat - Can participate in chats for events they're attending
      { resource: 'chat', action: 'read' },
      { resource: 'chat', action: 'write' },
      
      // Profile
      { resource: 'profile', action: 'read' },
      { resource: 'profile', action: 'update' },
    ]);
  }

  hasPermission(
    userRole: Role,
    resource: string,
    action: string,
    user?: any,
    resourceData?: any
  ): boolean {
    const rolePermissions = this.permissions.get(userRole);
    if (!rolePermissions) return false;

    const permission = rolePermissions.find(
      p => p.resource === resource && p.action === action
    );

    if (!permission) return false;

    // Check condition if it exists
    if (permission.condition && user && resourceData) {
      return permission.condition(user, resourceData);
    }

    // If no condition, permission is granted
    return !permission.condition;
  }

  getUserPermissions(userRole: Role): Permission[] {
    return this.permissions.get(userRole) || [];
  }

  canCreateEvent(userRole: Role): boolean {
    return this.hasPermission(userRole, 'events', 'create');
  }

  canCreateTask(userRole: Role): boolean {
    return this.hasPermission(userRole, 'tasks', 'create');
  }

  canCreatePoll(userRole: Role): boolean {
    return this.hasPermission(userRole, 'polls', 'create');
  }

  canAccessAdmin(userRole: Role): boolean {
    return this.hasPermission(userRole, 'admin', 'access_panel');
  }

  canManageEvent(userRole: Role, user: any, event: any): boolean {
    return this.hasPermission(userRole, 'events', 'update', user, event);
  }

  canManageTask(userRole: Role, user: any, task: any): boolean {
    return this.hasPermission(userRole, 'tasks', 'update', user, task);
  }

  canManagePoll(userRole: Role, user: any, poll: any): boolean {
    return this.hasPermission(userRole, 'polls', 'update', user, poll);
  }

  canDeleteEvent(userRole: Role, user: any, event: any): boolean {
    return this.hasPermission(userRole, 'events', 'delete', user, event);
  }

  canDeleteTask(userRole: Role, user: any, task: any): boolean {
    return this.hasPermission(userRole, 'tasks', 'delete', user, task);
  }

  canDeletePoll(userRole: Role, user: any, poll: any): boolean {
    return this.hasPermission(userRole, 'polls', 'delete', user, poll);
  }

  // Role hierarchy check
  isHigherRole(userRole: Role, targetRole: Role): boolean {
    const hierarchy = {
      [Role.ADMIN]: 3,
      [Role.ORGANIZER]: 2,
      [Role.GUEST]: 1,
    };

    return hierarchy[userRole] > hierarchy[targetRole];
  }

  // Get allowed actions for a resource
  getAllowedActions(userRole: Role, resource: string): string[] {
    const rolePermissions = this.permissions.get(userRole) || [];
    return rolePermissions
      .filter(p => p.resource === resource)
      .map(p => p.action);
  }

  // Check if user can perform action on specific resource instance
  canPerformAction(
    userRole: Role,
    resource: string,
    action: string,
    user: any,
    resourceData?: any
  ): boolean {
    return this.hasPermission(userRole, resource, action, user, resourceData);
  }
}
