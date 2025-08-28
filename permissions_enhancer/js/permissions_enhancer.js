(function ($, Drupal) {
  'use strict';

  /**
   * Permissions Enhancer behavior.
   */
  Drupal.behaviors.permissionsEnhancer = {
    attach: function (context, settings) {
      var $table = $('#permissions', context);

      if ($table.length === 0) {
        return;
      }

      // Initialize the enhancer only once
      if ($table.hasClass('permissions-enhancer-processed')) {
        return;
      }
      $table.addClass('permissions-enhancer-processed');

      var enhancer = new PermissionsEnhancer($table);
      enhancer.init();
    }
  };

  /**
   * PermissionsEnhancer class.
   */
  function PermissionsEnhancer($table) {
    this.$table = $table;
    this.moduleGroups = [];
    this.controlButtons = {};
  }

  PermissionsEnhancer.prototype = {

    /**
     * Initialize the enhancer.
     */
    init: function () {
      this.parseTableStructure();
      this.createModuleGroups();
      this.attachControlButtonEvents();
      this.addToggleClickHandlers();
    },

    /**
     * Parse the table structure to identify module headers and permission rows.
     */
    parseTableStructure: function () {
      var self = this;
      var currentModule = null;

      this.$table.find('tr').each(function (index) {
        var $row = $(this);
        var $cells = $row.find('td');

        // Module header row: single cell with colspan
        if ($cells.length === 1 && $cells.first().attr('colspan')) {
          var moduleText = $cells.first().text().trim();
          currentModule = {
            $headerRow: $row,
            $headerCell: $cells.first(),
            name: moduleText,
            permissionRows: [],
            isCollapsed: false
          };
          self.moduleGroups.push(currentModule);

          // Add click handler and styling to module header
          $row.addClass('permissions-enhancer-module-header');
          $cells.first().addClass('permissions-enhancer-clickable');

        }
        // Permission row: multiple cells with checkbox in second cell
        else if ($cells.length >= 2 && currentModule) {
          var $checkbox = $cells.eq(1).find('input[type="checkbox"]');
          if ($checkbox.length > 0) {
            var permissionRow = {
              $row: $row,
              $checkbox: $checkbox,
              isActive: $checkbox.is(':checked')
            };
            currentModule.permissionRows.push(permissionRow);
            $row.addClass('permissions-enhancer-permission-row');
            $row.attr('data-module', currentModule.name);
          }
        }
      });
    },

    /**
     * Create visual enhancements for module groups.
     */
    createModuleGroups: function () {
      var self = this;

      $.each(this.moduleGroups, function (index, moduleGroup) {
        // Add permission count
        var totalCount = moduleGroup.permissionRows.length;
        var activeCount = moduleGroup.permissionRows.filter(function (row) {
          return row.isActive;
        }).length;

        var countStyle = activeCount > 0 ? 'has-perms' : 'no-perms';

        // Add toggle indicator to module header
        var $toggleIndicator = $('<span class="permissions-enhancer-toggle">▼</span>');
        moduleGroup.$headerCell.prepend($toggleIndicator);
        moduleGroup.$headerRow.addClass(countStyle);

        var $countIndicator = $('<span class="permissions-enhancer-count"> (' +
          activeCount + '/' + totalCount + ' active)</span>');
        moduleGroup.$headerCell.append($countIndicator);

        // Store references for later use
        moduleGroup.$toggleIndicator = $toggleIndicator;
        moduleGroup.$countIndicator = $countIndicator;
        moduleGroup.totalCount = totalCount;
        moduleGroup.activeCount = activeCount;
        moduleGroup.countStyle = countStyle;
      });
    },

    /**
     * Add click handlers to module headers for toggling.
     */
    addToggleClickHandlers: function () {
      var self = this;

      $.each(this.moduleGroups, function (index, moduleGroup) {
        moduleGroup.$headerRow.on('click', function (e) {
          e.preventDefault();
          self.toggleModuleGroup(moduleGroup);
        });
      });
    },

    /**
     * Toggle a module group's visibility.
     */
    toggleModuleGroup: function (moduleGroup) {
      var self = this;
      moduleGroup.isCollapsed = !moduleGroup.isCollapsed;

      $.each(moduleGroup.permissionRows, function (index, permissionRow) {
        permissionRow.$row.addClass(moduleGroup.countStyle);
        if (moduleGroup.isCollapsed) {
          permissionRow.$row.hide();
        } else {
          permissionRow.$row.show();
        }
      });

      // Update toggle indicator
      if (moduleGroup.isCollapsed) {
        moduleGroup.$toggleIndicator.text('▶');
        var hiddenCount = moduleGroup.permissionRows.length;
        moduleGroup.$countIndicator.text(' (' + hiddenCount + ' permissions hidden)');
      } else {
        moduleGroup.$toggleIndicator.text('▼');
        moduleGroup.$countIndicator.text(' (' +
          moduleGroup.activeCount + '/' + moduleGroup.totalCount + ' active)');
      }
    },

    /**
     * Attach events to control buttons.
     */
    attachControlButtonEvents: function () {
      var self = this;

      // Expand All button
      $('.permissions-enhancer-expand-all').on('click', function (e) {
        e.preventDefault();
        self.expandAll();
      });

      // Collapse All button
      $('.permissions-enhancer-collapse-all').on('click', function (e) {
        e.preventDefault();
        self.collapseAll();
      });

      // Collapse Inactive button
      $('.permissions-enhancer-collapse-inactive').on('click', function (e) {
        e.preventDefault();
        self.collapseInactive();
      });
    },

    /**
     * Expand all module groups.
     */
    expandAll: function () {
      var self = this;
      $.each(this.moduleGroups, function (index, moduleGroup) {
        if (moduleGroup.isCollapsed) {
          self.toggleModuleGroup(moduleGroup);
        }
      });
    },

    /**
     * Collapse all module groups.
     */
    collapseAll: function () {
      var self = this;
      $.each(this.moduleGroups, function (index, moduleGroup) {
        if (!moduleGroup.isCollapsed) {
          self.toggleModuleGroup(moduleGroup);
        }
      });
    },

    /**
     * Collapse module groups that have no active permissions.
     */
    collapseInactive: function () {
      var self = this;
      $.each(this.moduleGroups, function (index, moduleGroup) {
        if (moduleGroup.activeCount === 0 && !moduleGroup.isCollapsed) {
          self.toggleModuleGroup(moduleGroup);
        }
      });
    }
  };

})(jQuery, Drupal);
